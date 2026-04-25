using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.EventBus.Configuration;
using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.BuildingBlocks.Common;
using DijitalAtolye.BuildingBlocks.WebHostExtensions;
using DijitalAtolye.Content.API.Consumers;
using DijitalAtolye.Content.API.Endpoints;
using DijitalAtolye.Content.API.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddDijitalAtolyeServiceDefaults("content");

builder.Services.AddDbContext<ContentDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")
        ?? throw new InvalidOperationException("Postgres connection string missing.")));

builder.Services.AddScoped<ICurrentUser, CurrentUserAccessor>();
builder.Services.AddScoped<IOutboxWriter, EfCoreOutboxWriter<ContentDbContext>>();
builder.Services.AddHostedService<OutboxDispatcher<ContentDbContext>>();
builder.Services.AddDijitalAtolyeJwtAuth(builder.Configuration);
builder.Services.AddDijitalAtolyeEventBus(
    builder.Configuration,
    serviceName: "content",
    configureBus: null,
    typeof(AIModerationCompletedConsumer).Assembly);

builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Postgres")!, tags: ["ready"]);

var app = builder.Build();
app.UseDijitalAtolyeServiceDefaults();
app.UseAuthentication();
app.UseAuthorization();
app.MapContentEndpoints();
app.MapEngagementEndpoints();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<ContentDbContext>().Database.MigrateAsync();
}

app.Run();
