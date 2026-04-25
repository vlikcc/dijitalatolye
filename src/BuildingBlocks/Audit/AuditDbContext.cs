using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.BuildingBlocks.Audit;

public class AuditDbContext : DbContext
{
    public AuditDbContext(DbContextOptions<AuditDbContext> options) : base(options) { }

    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("audit");
        modelBuilder.Entity<AuditEntry>(b =>
        {
            b.ToTable("entries");
            b.HasKey(x => x.Id);
            b.Property(x => x.ServiceName).HasMaxLength(64).IsRequired();
            b.Property(x => x.Action).HasMaxLength(128).IsRequired();
            b.Property(x => x.EntityType).HasMaxLength(128);
            b.Property(x => x.EntityId).HasMaxLength(128);
            b.Property(x => x.UserName).HasMaxLength(256);
            b.Property(x => x.IpAddress).HasMaxLength(64);
            b.Property(x => x.UserAgent).HasMaxLength(512);
            b.Property(x => x.CorrelationId).HasMaxLength(64);
            b.Property(x => x.Severity).HasMaxLength(16).IsRequired();
            b.HasIndex(x => x.OccurredAt);
            b.HasIndex(x => new { x.UserId, x.OccurredAt });
            b.HasIndex(x => new { x.Action, x.OccurredAt });
        });
    }
}
