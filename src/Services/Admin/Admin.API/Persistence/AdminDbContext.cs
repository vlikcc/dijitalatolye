using DijitalAtolye.Admin.API.Domain;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Admin.API.Persistence;

public sealed class AdminDbContext : DbContext
{
    public AdminDbContext(DbContextOptions<AdminDbContext> options) : base(options) { }

    public DbSet<AiModerationConfig> AiConfigs => Set<AiModerationConfig>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("admin");
        modelBuilder.Entity<AiModerationConfig>(b =>
        {
            b.ToTable("AiModerationConfig");
            b.HasKey(c => c.Id);
            b.Property(c => c.PrimaryProvider).HasMaxLength(80).IsRequired();
            b.Property(c => c.FallbackProvider).HasMaxLength(80);
            b.Property(c => c.Model).HasMaxLength(80).IsRequired();
            b.Property(c => c.PromptVersion).HasMaxLength(20).IsRequired();
        });
    }
}
