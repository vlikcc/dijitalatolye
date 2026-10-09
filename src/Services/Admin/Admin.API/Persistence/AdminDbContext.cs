using DijitalAtolye.Admin.API.Domain;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Admin.API.Persistence;

public sealed class AdminDbContext : DbContext
{
    public AdminDbContext(DbContextOptions<AdminDbContext> options) : base(options) { }

    /// <summary>Migration geçmişi kendi şemasında tutulur (aynı DB'yi paylaşan context'ler çakışmasın).</summary>
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseNpgsql(o => o.MigrationsHistoryTable("__EFMigrationsHistory", "admin"));

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

public sealed class AdminDbContextFactory : Microsoft.EntityFrameworkCore.Design.IDesignTimeDbContextFactory<AdminDbContext>
{
    public AdminDbContext CreateDbContext(string[] args)
    {
        var cs = Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
            ?? "Host=localhost;Port=5432;Database=audit;Username=dijitalatolye;Password=";
        return new AdminDbContext(new DbContextOptionsBuilder<AdminDbContext>().UseNpgsql(cs).Options);
    }
}
