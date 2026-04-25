using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.User.API.Domain;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.User.API.Persistence;

public sealed class UserDbContext : DbContext
{
    public UserDbContext(DbContextOptions<UserDbContext> options) : base(options) { }

    public DbSet<UserProfile> Profiles => Set<UserProfile>();

    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("user");

        modelBuilder.Entity<UserProfile>(b =>
        {
            b.ToTable("Profiles");
            b.HasKey(p => p.UserId);
            b.Property(p => p.Email).HasMaxLength(256).IsRequired();
            b.HasIndex(p => p.Email).IsUnique();
            b.Property(p => p.DisplayName).HasMaxLength(120).IsRequired();
            b.Property(p => p.FullName).HasMaxLength(200);
            b.Property(p => p.AvatarUrl).HasMaxLength(500);
            b.Property(p => p.Bio).HasMaxLength(1000);
            b.Property(p => p.Subject).HasMaxLength(120);
            b.Property(p => p.SchoolName).HasMaxLength(200);
            b.Property(p => p.City).HasMaxLength(80);
            b.Property(p => p.PrimaryRole).HasMaxLength(40).IsRequired();
            b.Property(p => p.TeacherVerification).HasConversion<string>().HasMaxLength(40);
        });

        modelBuilder.ApplyConfiguration(new OutboxMessageEntityConfiguration());
    }
}

public sealed class UserDbContextFactory : Microsoft.EntityFrameworkCore.Design.IDesignTimeDbContextFactory<UserDbContext>
{
    public UserDbContext CreateDbContext(string[] args)
    {
        var cs = Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
            ?? "Host=localhost;Port=5432;Database=user;Username=dijitalatolye;Password=";
        return new UserDbContext(new DbContextOptionsBuilder<UserDbContext>().UseNpgsql(cs).Options);
    }
}
