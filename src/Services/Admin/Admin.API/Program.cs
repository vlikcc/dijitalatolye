using DijitalAtolye.Admin.API.Audit;
using DijitalAtolye.Admin.API.Consumers;
using DijitalAtolye.Admin.API.Endpoints;
using DijitalAtolye.Admin.API.Persistence;
using DijitalAtolye.Admin.API.Services;
using DijitalAtolye.BuildingBlocks.Audit;
using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.Common;
using DijitalAtolye.BuildingBlocks.EventBus.Configuration;
using DijitalAtolye.BuildingBlocks.WebHostExtensions;
using Elastic.Clients.Elasticsearch;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddDijitalAtolyeServiceDefaults("admin");

builder.Services.AddScoped<ICurrentUser, CurrentUserAccessor>();
builder.Services.AddDijitalAtolyeJwtAuth(builder.Configuration);
builder.Services.AddAuthorization();
builder.Services.AddDijitalAtolyeAudit(builder.Configuration, serviceName: "admin");
builder.Services.AddAuditEventPublisher<MassTransitAuditEventPublisher>();

builder.Services.Configure<DownstreamServiceOptions>(builder.Configuration.GetSection("DownstreamServices"));
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient("admin-downstream");
builder.Services.AddScoped<DashboardAggregator>();

builder.Services.AddDbContext<AdminDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")
        ?? builder.Configuration.GetConnectionString("Audit")
        ?? (builder.Environment.IsDevelopment()
            ? "Host=localhost;Port=5432;Database=admin;Username=postgres;Password="
            : throw new InvalidOperationException("ConnectionStrings:Postgres missing."))));

var esUri = new Uri(builder.Configuration["Elasticsearch:Uri"] ?? "http://localhost:9200");
builder.Services.AddSingleton(new ElasticsearchClient(new ElasticsearchClientSettings(esUri).DefaultIndex(AuditIndexConsumer.IndexName)));

builder.Services.AddDijitalAtolyeEventBus(
    builder.Configuration,
    serviceName: "admin",
    consumerAssemblies: typeof(AuditIndexConsumer).Assembly);

builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Audit")
        ?? builder.Configuration.GetConnectionString("Postgres")
        ?? "Host=localhost;Port=5432;Database=audit;Username=postgres;Password=", name: "audit-postgres", tags: ["ready"])
    .AddCheck<ElasticsearchHealthCheck>("elasticsearch", tags: ["ready"]);

var app = builder.Build();

app.UseDijitalAtolyeServiceDefaults();
app.UseAuthentication();
app.UseAuthorization();

app.MapAuditEndpoints();
app.MapAdminProxyEndpoints();
app.MapAiConfigEndpoints();

if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Database:AutoMigrate"))
{
    // audit ve admin şemaları aynı DB'de (prod: Database=audit); her context kendi şemasındaki
    // __EFMigrationsHistory tablosunu kullanır.
    await app.Services.MigrateAuditDatabaseAsync().ConfigureAwait(false);
    using var scope = app.Services.CreateScope();
    var adminDb = scope.ServiceProvider.GetRequiredService<AdminDbContext>();
    await adminDb.MigrateDatabaseAsync().ConfigureAwait(false);
    if (!await adminDb.AiConfigs.AnyAsync())
    {
        adminDb.AiConfigs.Add(new DijitalAtolye.Admin.API.Domain.AiModerationConfig());
        await adminDb.SaveChangesAsync();
    }
}

await app.RunAsync().ConfigureAwait(false);
