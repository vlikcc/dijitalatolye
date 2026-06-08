using DijitalAtolye.Notification.API.Domain;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Notification.API.Persistence;

public sealed class NotificationDbContext : DbContext
{
    public NotificationDbContext(DbContextOptions<NotificationDbContext> options) : base(options) { }

    public DbSet<InAppNotification> Notifications => Set<InAppNotification>();
    public DbSet<EmailLog> EmailLogs => Set<EmailLog>();
    public DbSet<PushSubscriptionEntity> PushSubscriptions => Set<PushSubscriptionEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("notification");
        modelBuilder.Entity<InAppNotification>(b =>
        {
            b.ToTable("Notifications");
            b.HasKey(n => n.Id);
            b.Property(n => n.Type).HasMaxLength(60).IsRequired();
            b.Property(n => n.Title).HasMaxLength(200).IsRequired();
            b.Property(n => n.Body).HasMaxLength(2000).IsRequired();
            b.Property(n => n.Link).HasMaxLength(500);
            b.HasIndex(n => new { n.UserId, n.ReadAtUtc });
        });
        modelBuilder.Entity<EmailLog>(b =>
        {
            b.ToTable("EmailLogs");
            b.HasKey(e => e.Id);
            b.Property(e => e.ToEmail).HasMaxLength(320).IsRequired();
            b.Property(e => e.Subject).HasMaxLength(200).IsRequired();
            b.Property(e => e.Template).HasMaxLength(120).IsRequired();
            b.Property(e => e.Error).HasMaxLength(2000);
            b.HasIndex(e => e.ToEmail);
        });
        modelBuilder.Entity<PushSubscriptionEntity>(b =>
        {
            b.ToTable("PushSubscriptions");
            b.HasKey(s => s.Id);
            b.Property(s => s.Endpoint).HasMaxLength(1000).IsRequired();
            b.Property(s => s.P256dh).HasMaxLength(300).IsRequired();
            b.Property(s => s.Auth).HasMaxLength(300).IsRequired();
            b.HasIndex(s => s.Endpoint).IsUnique();
            b.HasIndex(s => s.UserId);
        });
    }
}

public sealed class NotificationDbContextFactory : Microsoft.EntityFrameworkCore.Design.IDesignTimeDbContextFactory<NotificationDbContext>
{
    public NotificationDbContext CreateDbContext(string[] args)
    {
        var cs = Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
            ?? "Host=localhost;Port=5432;Database=notification;Username=dijitalatolye;Password=";
        return new NotificationDbContext(new DbContextOptionsBuilder<NotificationDbContext>().UseNpgsql(cs).Options);
    }
}
