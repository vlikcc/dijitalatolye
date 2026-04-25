using DijitalAtolye.Catalog.API.Domain;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Catalog.API.Persistence;

public sealed class CatalogDbContext : DbContext
{
    public CatalogDbContext(DbContextOptions<CatalogDbContext> options) : base(options) { }

    public DbSet<Grade> Grades => Set<Grade>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<Outcome> Outcomes => Set<Outcome>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<Category> Categories => Set<Category>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("catalog");

        modelBuilder.Entity<Grade>(b =>
        {
            b.HasKey(g => g.Id);
            b.Property(g => g.Code).HasMaxLength(20).IsRequired();
            b.Property(g => g.Name).HasMaxLength(80).IsRequired();
            b.Property(g => g.EducationStage).HasMaxLength(40);
            b.HasIndex(g => g.Code).IsUnique();
        });

        modelBuilder.Entity<Subject>(b =>
        {
            b.HasKey(s => s.Id);
            b.Property(s => s.Code).HasMaxLength(60).IsRequired();
            b.Property(s => s.Name).HasMaxLength(120).IsRequired();
            b.HasIndex(s => s.Code).IsUnique();
        });

        modelBuilder.Entity<Unit>(b =>
        {
            b.HasKey(u => u.Id);
            b.Property(u => u.Name).HasMaxLength(200).IsRequired();
            b.HasIndex(u => new { u.SubjectId, u.GradeId, u.Order }).IsUnique();
        });

        modelBuilder.Entity<Outcome>(b =>
        {
            b.HasKey(o => o.Id);
            b.Property(o => o.Code).HasMaxLength(60).IsRequired();
            b.Property(o => o.Description).HasMaxLength(1000).IsRequired();
            b.HasIndex(o => o.Code).IsUnique();
        });

        modelBuilder.Entity<Tag>(b =>
        {
            b.HasKey(t => t.Id);
            b.Property(t => t.Slug).HasMaxLength(80).IsRequired();
            b.Property(t => t.DisplayName).HasMaxLength(120).IsRequired();
            b.Property(t => t.Status).HasConversion<string>().HasMaxLength(20);
            b.HasIndex(t => t.Slug).IsUnique();
            b.HasIndex(t => t.Status);
        });

        modelBuilder.Entity<Category>(b =>
        {
            b.HasKey(c => c.Id);
            b.Property(c => c.Code).HasMaxLength(60).IsRequired();
            b.Property(c => c.Name).HasMaxLength(120).IsRequired();
            b.HasIndex(c => c.Code).IsUnique();
        });
    }
}

public sealed class CatalogDbContextFactory : Microsoft.EntityFrameworkCore.Design.IDesignTimeDbContextFactory<CatalogDbContext>
{
    public CatalogDbContext CreateDbContext(string[] args)
    {
        var cs = Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
            ?? "Host=localhost;Port=5432;Database=catalog;Username=dijitalatolye;Password=";
        return new CatalogDbContext(new DbContextOptionsBuilder<CatalogDbContext>().UseNpgsql(cs).Options);
    }
}
