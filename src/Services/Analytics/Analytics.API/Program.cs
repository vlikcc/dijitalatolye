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

builder.Services.AddDbContext<AnalyticsDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")
        ?? "Host=localhost;Port=5432;Database=analytics;Username=postgres;Password="));

builder.Services.AddScoped<ICurrentUser, CurrentUserAccessor>();
builder.Services.AddDijitalAtolyeJwtAuth(builder.Configuration);
builder.Services.AddAuthorization();

builder.Services.AddDijitalAtolyeEventBus(
    builder.Configuration,
    serviceName: "analytics",
    configureBus: null,
    typeof(ContentPublishedConsumer).Assembly);

builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Postgres")
        ?? "Host=localhost;Port=5432;Database=analytics;Username=postgres;Password=", name: "postgres");

var app = builder.Build();

app.UseDijitalAtolyeServiceDefaults();
app.UseAuthentication();
app.UseAuthorization();

app.MapAnalyticsEndpoints();

if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Database:AutoMigrate"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AnalyticsDbContext>();
    await db.EnsureSchemaAsync().ConfigureAwait(false);
}

await app.RunAsync().ConfigureAwait(false);
