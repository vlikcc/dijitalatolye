using DijitalAtolye.Analytics.API.Aggregation;
using DijitalAtolye.Analytics.API.Consumers;
using DijitalAtolye.Analytics.API.Endpoints;
using DijitalAtolye.Analytics.API.Persistence;
using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.EventBus.Configuration;
using DijitalAtolye.BuildingBlocks.Common;
using DijitalAtolye.BuildingBlocks.WebHostExtensions;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddDijitalAtolyeServiceDefaults("analytics");

var analyticsConnection = builder.Configuration.GetConnectionString("Postgres")
    ?? (builder.Environment.IsDevelopment()
        ? "Host=localhost;Port=5432;Database=analytics;Username=postgres;Password="
        : throw new InvalidOperationException("ConnectionStrings:Postgres missing."));

builder.Services.AddDbContext<AnalyticsDbContext>(o => o.UseNpgsql(analyticsConnection));

builder.Services.AddScoped<ICurrentUser, CurrentUserAccessor>();
builder.Services.AddDijitalAtolyeJwtAuth(builder.Configuration);
builder.Services.AddAuthorization();

builder.Services.AddDijitalAtolyeEventBus(
    builder.Configuration,
    serviceName: "analytics",
    configureBus: null,
    typeof(ContentPublishedConsumer).Assembly);

builder.Services.AddHealthChecks()
    .AddNpgSql(analyticsConnection, name: "postgres", tags: ["ready"]);

// Ham olayları gün bazlı agregatlara toplayan worker.
builder.Services.AddHostedService<AnalyticsAggregator>();

var app = builder.Build();

app.UseDijitalAtolyeServiceDefaults();
app.UseAuthentication();
app.UseAuthorization();

app.MapAnalyticsEndpoints();

if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Database:AutoMigrate"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AnalyticsDbContext>();
    // Eski kurulumlardaki ALTER SQL'i yalnızca legacy DB baseline'lanırken bir kez çalışır.
    await db.MigrateDatabaseAsync(AnalyticsLegacySchema.UpgradeAsync).ConfigureAwait(false);
}

await app.RunAsync().ConfigureAwait(false);
