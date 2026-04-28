using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.EventBus.Configuration;
using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.BuildingBlocks.Common;
using DijitalAtolye.BuildingBlocks.WebHostExtensions;
using DijitalAtolye.Content.API.Consumers;
using DijitalAtolye.Content.API.Endpoints;
using DijitalAtolye.Content.API.Persistence;
using Microsoft.EntityFrameworkCore;
using Minio;

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

var minioOpts = builder.Configuration.GetSection("Minio").Get<DijitalAtolye.Content.API.Endpoints.ContentMinioOptions>()
    ?? new DijitalAtolye.Content.API.Endpoints.ContentMinioOptions();
builder.Services.AddSingleton(minioOpts);

builder.Services.AddSingleton<IMinioClient>(_ => new MinioClient()
    .WithEndpoint(minioOpts.Endpoint)
    .WithCredentials(minioOpts.AccessKey, minioOpts.SecretKey)
    .WithSSL(minioOpts.UseSsl)
    .Build());
builder.Services.AddScoped<DijitalAtolye.Content.API.Bundles.BundleValidator>();
builder.Services.AddScoped<DijitalAtolye.Content.API.Bundles.BundleExtractor>();

builder.Services.AddSingleton<DijitalAtolye.Content.API.Endpoints.PlayPresignClient>(_ =>
{
    var publicUri = !string.IsNullOrWhiteSpace(minioOpts.PublicEndpoint)
        && Uri.TryCreate(minioOpts.PublicEndpoint, UriKind.Absolute, out var u) ? u : null;
    string endpoint;
    bool useSsl;
    if (publicUri is null)
    {
        endpoint = minioOpts.Endpoint;
        useSsl = minioOpts.UseSsl;
    }
    else
    {
        endpoint = publicUri.IsDefaultPort ? publicUri.Host : $"{publicUri.Host}:{publicUri.Port}";
        useSsl = publicUri.Scheme == Uri.UriSchemeHttps;
    }
    var client = new MinioClient()
        .WithEndpoint(endpoint)
        .WithCredentials(minioOpts.AccessKey, minioOpts.SecretKey)
        .WithSSL(useSsl)
        .Build();
    return new DijitalAtolye.Content.API.Endpoints.PlayPresignClient(client);
});

var app = builder.Build();
app.UseDijitalAtolyeServiceDefaults();
app.UseAuthentication();
app.UseAuthorization();
app.MapContentEndpoints();
app.MapEngagementEndpoints();
app.MapPlayEndpoints();

if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Database:AutoMigrate"))
{
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<ContentDbContext>().EnsureSchemaAsync();
}

app.Run();
