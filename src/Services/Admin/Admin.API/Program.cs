using DijitalAtolye.Admin.API.Endpoints;
using DijitalAtolye.BuildingBlocks.Audit;
using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.WebHostExtensions;

var builder = WebApplication.CreateBuilder(args);

builder.AddDijitalAtolyeServiceDefaults("admin");

builder.Services.AddScoped<ICurrentUser, CurrentUserAccessor>();
builder.Services.AddDijitalAtolyeJwtAuth(builder.Configuration);
builder.Services.AddAuthorization();
builder.Services.AddDijitalAtolyeAudit(builder.Configuration, serviceName: "admin");

builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Audit")
        ?? builder.Configuration.GetConnectionString("Postgres")
        ?? "Host=localhost;Port=5432;Database=audit;Username=postgres;Password=", name: "audit-postgres");

var app = builder.Build();

app.UseDijitalAtolyeServiceDefaults();
app.UseAuthentication();
app.UseAuthorization();

app.MapAuditEndpoints();
app.MapAdminProxyEndpoints();

if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Database:AutoMigrate"))
{
    await app.Services.EnsureAuditSchemaAsync().ConfigureAwait(false);
}

await app.RunAsync().ConfigureAwait(false);
