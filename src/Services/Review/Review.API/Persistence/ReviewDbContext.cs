using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.Review.API.Domain;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Review.API.Persistence;

public sealed class ReviewDbContext : DbContext
{
    public ReviewDbContext(DbContextOptions<ReviewDbContext> options) : base(options) { }

    public DbSet<ReviewItem> ReviewItems => Set<ReviewItem>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("review");

        modelBuilder.Entity<ReviewItem>(b =>
        {
            b.ToTable("ReviewItems");
            b.HasKey(r => r.Id);
            b.Property(r => r.Title).HasMaxLength(200).IsRequired();
            b.Property(r => r.Status).HasConversion<string>().HasMaxLength(20);
            b.Property(r => r.AIDecision).HasConversion<string>().HasMaxLength(40);
            b.HasIndex(r => new { r.ContentId, r.VersionId }).IsUnique();
            b.HasIndex(r => r.Status);
            b.HasIndex(r => r.AssignedEditorId);
        });

        modelBuilder.ApplyConfiguration(new OutboxMessageEntityConfiguration());
    }
}

public sealed class ReviewDbContextFactory : Microsoft.EntityFrameworkCore.Design.IDesignTimeDbContextFactory<ReviewDbContext>
{
    public ReviewDbContext CreateDbContext(string[] args)
    {
        var cs = Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
            ?? "Host=localhost;Port=5432;Database=review;Username=dijitalatolye;Password=";
        return new ReviewDbContext(new DbContextOptionsBuilder<ReviewDbContext>().UseNpgsql(cs).Options);
    }
}
