using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.Content.API.Domain;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Content.API.Persistence;

public sealed class ContentDbContext : DbContext
{
    public ContentDbContext(DbContextOptions<ContentDbContext> options) : base(options) { }

    /// <summary>Migration geçmişi kendi şemasında tutulur (aynı DB'yi paylaşan context'ler çakışmasın).</summary>
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseNpgsql(o => o.MigrationsHistoryTable("__EFMigrationsHistory", "content"));

    public DbSet<Domain.Content> Contents => Set<Domain.Content>();
    public DbSet<ContentVersion> Versions => Set<ContentVersion>();
    public DbSet<ContentLike> Likes => Set<ContentLike>();
    public DbSet<ContentFavorite> Favorites => Set<ContentFavorite>();
    public DbSet<ContentComment> Comments => Set<ContentComment>();
    public DbSet<ContentRating> Ratings => Set<ContentRating>();
    public DbSet<GameStudioSession> StudioSessions => Set<GameStudioSession>();
    public DbSet<GameStudioTurn> StudioTurns => Set<GameStudioTurn>();
    public DbSet<UserAiCredential> AiCredentials => Set<UserAiCredential>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("content");

        modelBuilder.Entity<Domain.Content>(b =>
        {
            b.ToTable("Contents");
            b.HasKey(c => c.Id);
            b.Property(c => c.Title).HasMaxLength(200).IsRequired();
            b.Property(c => c.Description).HasMaxLength(2000);
            b.Property(c => c.Slug).HasMaxLength(220);
            b.HasIndex(c => c.Slug).IsUnique().HasFilter(@"""Slug"" IS NOT NULL");
            b.Property(c => c.Subjects).HasColumnType("text[]");
            b.Property(c => c.GradeLevels).HasColumnType("integer[]");
            b.Property(c => c.Difficulty).HasMaxLength(10);
            b.Property(c => c.CoverImageBucket).HasMaxLength(120);
            b.Property(c => c.CoverImageKey).HasMaxLength(500);
            b.Property(c => c.PublishedBucket).HasMaxLength(120);
            b.Property(c => c.PublishedKey).HasMaxLength(500);
            b.Property(c => c.State).HasConversion<string>().HasMaxLength(40);
            b.Property(c => c.Type).HasConversion<string>().HasMaxLength(20).HasDefaultValue(ContentType.Game);
            b.Property(c => c.OutcomeCodes).HasColumnType("text[]");
            b.Property(c => c.Tags).HasColumnType("text[]");
            b.Property(c => c.AiSuggestionJson).HasColumnType("text");
            b.Property(c => c.AutoRejectReason).HasColumnType("text");
            b.Property(c => c.Source).HasConversion<string>().HasMaxLength(20).HasDefaultValue(ContentSource.Upload);
            b.Property(c => c.GeneratedByModel).HasMaxLength(100);
            b.HasIndex(c => c.AuthorUserId);
            b.HasIndex(c => c.State);
            b.HasIndex(c => c.Type);
            b.HasMany(c => c.Versions).WithOne()
                .HasForeignKey(v => v.ContentId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ContentVersion>(b =>
        {
            b.ToTable("ContentVersions");
            b.HasKey(v => v.Id);
            b.Property(v => v.StorageBucket).HasMaxLength(120).IsRequired();
            b.Property(v => v.StorageKey).HasMaxLength(500).IsRequired();
            b.Property(v => v.ManifestEntry).HasMaxLength(200).IsRequired();
            b.Property(v => v.Sha256).HasMaxLength(128);
            b.Property(v => v.GuardFileId).HasMaxLength(64);
            b.Property(v => v.GuardScanStatus).HasMaxLength(40);
            b.HasIndex(v => new { v.ContentId, v.VersionNumber }).IsUnique();
        });

        modelBuilder.Entity<ContentLike>(b =>
        {
            b.ToTable("ContentLikes");
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.ContentId, x.UserId }).IsUnique();
        });
        modelBuilder.Entity<ContentFavorite>(b =>
        {
            b.ToTable("ContentFavorites");
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.ContentId, x.UserId }).IsUnique();
        });
        modelBuilder.Entity<ContentComment>(b =>
        {
            b.ToTable("ContentComments");
            b.HasKey(x => x.Id);
            b.Property(x => x.Body).HasMaxLength(2000).IsRequired();
            b.HasIndex(x => x.ContentId);
        });
        modelBuilder.Entity<ContentRating>(b =>
        {
            b.ToTable("ContentRatings");
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.ContentId, x.UserId }).IsUnique();
        });

        modelBuilder.Entity<GameStudioSession>(b =>
        {
            b.ToTable("StudioSessions");
            b.HasKey(s => s.Id);
            b.Property(s => s.Title).HasMaxLength(200).IsRequired();
            b.Property(s => s.Idea).HasMaxLength(4000).IsRequired();
            b.Property(s => s.Subjects).HasColumnType("text[]");
            b.Property(s => s.GradeLevels).HasColumnType("integer[]");
            b.Property(s => s.OutcomeCodes).HasColumnType("text[]");
            b.Property(s => s.Model).HasMaxLength(100).IsRequired();
            b.Property(s => s.KeySource).HasConversion<string>().HasMaxLength(20);
            b.HasIndex(s => s.OwnerUserId);
            b.HasMany(s => s.Turns).WithOne()
                .HasForeignKey(t => t.SessionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<GameStudioTurn>(b =>
        {
            b.ToTable("StudioTurns");
            b.HasKey(t => t.Id);
            b.Property(t => t.UserPrompt).HasMaxLength(4000).IsRequired();
            b.Property(t => t.Status).HasConversion<string>().HasMaxLength(20);
            b.Property(t => t.Model).HasMaxLength(100).IsRequired();
            b.Property(t => t.KeySource).HasConversion<string>().HasMaxLength(20);
            b.Property(t => t.Html).HasColumnType("text");
            b.Property(t => t.ChangeSummary).HasMaxLength(2000);
            b.Property(t => t.Error).HasMaxLength(1000);
            b.Property(t => t.PreviewKey).HasMaxLength(500);
            b.HasIndex(t => new { t.SessionId, t.Seq }).IsUnique();
            // Günlük kota sayımı: kullanıcının bugünkü platform anahtarlı turları.
            b.HasIndex(t => new { t.OwnerUserId, t.CreatedAtUtc });
            b.HasIndex(t => t.Status);
        });

        modelBuilder.Entity<UserAiCredential>(b =>
        {
            b.ToTable("UserAiCredentials");
            b.HasKey(c => c.UserId);
            b.Property(c => c.Provider).HasMaxLength(40).IsRequired();
            b.Property(c => c.EncryptedApiKey).HasColumnType("text").IsRequired();
            b.Property(c => c.KeyLast4).HasMaxLength(8).IsRequired();
        });

        modelBuilder.ApplyConfiguration(new OutboxMessageEntityConfiguration());
    }
}

public sealed class ContentDbContextFactory : Microsoft.EntityFrameworkCore.Design.IDesignTimeDbContextFactory<ContentDbContext>
{
    public ContentDbContext CreateDbContext(string[] args)
    {
        var cs = Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
            ?? "Host=localhost;Port=5432;Database=content;Username=dijitalatolye;Password=";
        return new ContentDbContext(new DbContextOptionsBuilder<ContentDbContext>().UseNpgsql(cs).Options);
    }
}
