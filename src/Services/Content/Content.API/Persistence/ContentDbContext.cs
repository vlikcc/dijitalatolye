using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.Content.API.Domain;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Content.API.Persistence;

public sealed class ContentDbContext : DbContext
{
    public ContentDbContext(DbContextOptions<ContentDbContext> options) : base(options) { }

    public DbSet<Domain.Content> Contents => Set<Domain.Content>();
    public DbSet<ContentVersion> Versions => Set<ContentVersion>();
    public DbSet<ContentLike> Likes => Set<ContentLike>();
    public DbSet<ContentFavorite> Favorites => Set<ContentFavorite>();
    public DbSet<ContentComment> Comments => Set<ContentComment>();
    public DbSet<ContentRating> Ratings => Set<ContentRating>();
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
            b.Property(c => c.Subject).HasMaxLength(60);
            b.Property(c => c.Difficulty).HasMaxLength(10);
            b.Property(c => c.CoverImageBucket).HasMaxLength(120);
            b.Property(c => c.CoverImageKey).HasMaxLength(500);
            b.Property(c => c.PublishedBucket).HasMaxLength(120);
            b.Property(c => c.PublishedKey).HasMaxLength(500);
            b.Property(c => c.State).HasConversion<string>().HasMaxLength(40);
            b.Property(c => c.OutcomeCodes).HasColumnType("text[]");
            b.Property(c => c.Tags).HasColumnType("text[]");
            b.HasIndex(c => c.AuthorUserId);
            b.HasIndex(c => c.State);
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
