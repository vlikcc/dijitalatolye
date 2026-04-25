using DijitalAtolye.BuildingBlocks.Audit;
using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.EventBus.Configuration;
using DijitalAtolye.BuildingBlocks.Common;
using DijitalAtolye.BuildingBlocks.WebHostExtensions;
using DijitalAtolye.Identity.API.Endpoints;
using DijitalAtolye.Identity.API.Seed;
using DijitalAtolye.Identity.Application;
using DijitalAtolye.Identity.Infrastructure;
using DijitalAtolye.Identity.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var jwtSigningKey = builder.Configuration["JwtIssuer:SigningKey"]
    ?? Environment.GetEnvironmentVariable("JWT_SIGNING_KEY");
if (string.IsNullOrWhiteSpace(jwtSigningKey) || jwtSigningKey.Length < 32)
{
    throw new InvalidOperationException(
        "JwtIssuer:SigningKey bos veya 32 karakterden kisa. Ortam: JwtIssuer__SigningKey veya JWT_SIGNING_KEY; lokal icin 'make env' JWT_SIGNING_KEY uretir.");
}

builder.AddDijitalAtolyeServiceDefaults("identity");

builder.Services
    .AddIdentityApplication()
    .AddIdentityInfrastructure(builder.Configuration);

builder.Services.AddDijitalAtolyeEventBus(
    builder.Configuration,
    serviceName: "identity",
    configureBus: null);

builder.Services.AddScoped<ICurrentUser, CurrentUserAccessor>();
builder.Services.AddAuthorization();
builder.Services.AddDijitalAtolyeAudit(builder.Configuration, serviceName: "identity");

builder.Services
    .AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Postgres")!, name: "postgres", tags: ["ready"])
    .AddRabbitMQ(name: "rabbitmq", tags: ["ready"]);

var app = builder.Build();

app.UseDijitalAtolyeServiceDefaults();
app.UseAuthentication();
app.UseAuthorization();

app.MapAuthEndpoints();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
    await db.EnsureSchemaAsync();
    await IdentitySeeder.SeedAsync(scope.ServiceProvider);
    await app.Services.EnsureAuditSchemaAsync();
}

app.Run();

namespace DijitalAtolye.Identity.API
{
    public partial class Program;
}
