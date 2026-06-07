using DijitalAtolye.Analytics.API.Domain;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Analytics.API.Persistence;

public sealed class AnalyticsDbContext : DbContext
{
    public AnalyticsDbContext(DbContextOptions<AnalyticsDbContext> options) : base(options) { }

    public DbSet<AnalyticsEvent> Events => Set<AnalyticsEvent>();
    public DbSet<ContentDailyStats> DailyStats => Set<ContentDailyStats>();
    public DbSet<OutcomeDailyStats> OutcomeStats => Set<OutcomeDailyStats>();
    public DbSet<AggregationState> AggregationStates => Set<AggregationState>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.HasDefaultSchema("analytics");

        b.Entity<AnalyticsEvent>(e =>
        {
            e.ToTable("events");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.ContentId, x.OccurredAt });
            e.HasIndex(x => new { x.Type, x.OccurredAt });
            e.HasIndex(x => new { x.OutcomeCode, x.OccurredAt });
            e.Property(x => x.Source).HasMaxLength(64);
            e.Property(x => x.AnonymousSessionId).HasMaxLength(64);
            e.Property(x => x.UserAgent).HasMaxLength(512);
            e.Property(x => x.IpHash).HasMaxLength(128);
            e.Property(x => x.OutcomeCode).HasMaxLength(32);
        });

        b.Entity<ContentDailyStats>(e =>
        {
            e.ToTable("content_daily_stats");
            e.HasKey(x => new { x.ContentId, x.Day });
        });

        b.Entity<OutcomeDailyStats>(e =>
        {
            e.ToTable("outcome_daily_stats");
            e.HasKey(x => new { x.ContentId, x.OutcomeCode, x.Day });
            e.Property(x => x.OutcomeCode).HasMaxLength(32);
        });

        b.Entity<AggregationState>(e =>
        {
            e.ToTable("aggregation_state");
            e.HasKey(x => x.Id);
        });
    }
}

public sealed class AnalyticsDbContextFactory : Microsoft.EntityFrameworkCore.Design.IDesignTimeDbContextFactory<AnalyticsDbContext>
{
    public AnalyticsDbContext CreateDbContext(string[] args)
    {
        var cs = Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
            ?? "Host=localhost;Port=5432;Database=analytics;Username=postgres;Password=";
        var opts = new DbContextOptionsBuilder<AnalyticsDbContext>()
            .UseNpgsql(cs)
            .Options;
        return new AnalyticsDbContext(opts);
    }
}
