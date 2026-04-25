using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.EventBus.Configuration;
using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.BuildingBlocks.Common;
using DijitalAtolye.BuildingBlocks.WebHostExtensions;
using DijitalAtolye.Review.API.Consumers;
using DijitalAtolye.Review.API.Endpoints;
using DijitalAtolye.Review.API.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddDijitalAtolyeServiceDefaults("review");

builder.Services.AddDbContext<ReviewDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")
        ?? throw new InvalidOperationException("Postgres connection string missing.")));

builder.Services.AddScoped<ICurrentUser, CurrentUserAccessor>();
builder.Services.AddScoped<IOutboxWriter, EfCoreOutboxWriter<ReviewDbContext>>();
builder.Services.AddHostedService<OutboxDispatcher<ReviewDbContext>>();
builder.Services.AddDijitalAtolyeJwtAuth(builder.Configuration);

builder.Services.AddDijitalAtolyeEventBus(
    builder.Configuration,
    serviceName: "review",
    configureBus: null,
    typeof(AIModerationCompletedConsumer).Assembly);

builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Postgres")!, tags: ["ready"]);

var app = builder.Build();
app.UseDijitalAtolyeServiceDefaults();
app.UseAuthentication();
app.UseAuthorization();
app.MapReviewEndpoints();

if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Database:AutoMigrate"))
{
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<ReviewDbContext>().EnsureSchemaAsync();
}

app.Run();
