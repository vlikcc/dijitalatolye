using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.User.API.Domain;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.User.API.Persistence;

public sealed class UserDbContext : DbContext
{
    public UserDbContext(DbContextOptions<UserDbContext> options) : base(options) { }

    public DbSet<UserProfile> Profiles => Set<UserProfile>();
    public DbSet<UserCollection> Collections => Set<UserCollection>();
    public DbSet<CollectionItem> CollectionItems => Set<CollectionItem>();
    public DbSet<NotificationPreference> NotificationPreferences => Set<NotificationPreference>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<AssignmentMember> AssignmentMembers => Set<AssignmentMember>();
    public DbSet<SchoolClass> Classes => Set<SchoolClass>();
    public DbSet<ClassMember> ClassMembers => Set<ClassMember>();

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

        modelBuilder.Entity<UserCollection>(b =>
        {
            b.ToTable("Collections");
            b.HasKey(c => c.Id);
            b.Property(c => c.Name).HasMaxLength(120).IsRequired();
            b.Property(c => c.Description).HasMaxLength(500);
            b.HasIndex(c => c.UserId);
            b.HasMany(c => c.Items).WithOne().HasForeignKey(i => i.CollectionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CollectionItem>(b =>
        {
            b.ToTable("CollectionItems");
            b.HasKey(i => i.Id);
            b.HasIndex(i => new { i.CollectionId, i.ContentId }).IsUnique();
        });

        modelBuilder.Entity<NotificationPreference>(b =>
        {
            b.ToTable("NotificationPreferences");
            b.HasKey(p => p.UserId);
        });

        modelBuilder.Entity<Assignment>(b =>
        {
            b.ToTable("Assignments");
            b.HasKey(a => a.Id);
            b.Property(a => a.ContentTitle).HasMaxLength(300);
            b.Property(a => a.ContentSlug).HasMaxLength(300);
            b.Property(a => a.Title).HasMaxLength(300);
            b.Property(a => a.Instructions).HasMaxLength(2000);
            b.Property(a => a.JoinCode).HasMaxLength(12).IsRequired();
            b.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);
            b.HasIndex(a => a.JoinCode).IsUnique();
            b.HasIndex(a => a.TeacherUserId);
            b.HasMany(a => a.Members).WithOne().HasForeignKey(m => m.AssignmentId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AssignmentMember>(b =>
        {
            b.ToTable("AssignmentMembers");
            b.HasKey(m => m.Id);
            b.Property(m => m.StudentEmail).HasMaxLength(256);
            b.HasIndex(m => new { m.AssignmentId, m.StudentUserId }).IsUnique();
            b.HasIndex(m => m.StudentUserId);
        });

        modelBuilder.Entity<SchoolClass>(b =>
        {
            b.ToTable("Classes");
            b.HasKey(c => c.Id);
            b.Property(c => c.Name).HasMaxLength(160).IsRequired();
            b.HasIndex(c => c.TeacherUserId);
            b.HasMany(c => c.Members).WithOne().HasForeignKey(m => m.ClassId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ClassMember>(b =>
        {
            b.ToTable("ClassMembers");
            b.HasKey(m => m.Id);
            b.Property(m => m.StudentEmail).HasMaxLength(256);
            b.HasIndex(m => new { m.ClassId, m.StudentUserId }).IsUnique();
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
