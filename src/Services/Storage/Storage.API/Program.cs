using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.WebHostExtensions;
using DijitalAtolye.BuildingBlocks.EventBus.Configuration;
using DijitalAtolye.Storage.API.Consumers;
using DijitalAtolye.Storage.API.Endpoints;
using DijitalAtolye.Storage.API.Guard;
using DijitalAtolye.Storage.API.Storage;
using Minio;

var builder = WebApplication.CreateBuilder(args);

builder.AddDijitalAtolyeServiceDefaults("storage");

var minioOpts = builder.Configuration.GetSection("Minio").Get<MinioOptions>()
    ?? throw new InvalidOperationException("Minio configuration missing.");

builder.Services.AddSingleton(minioOpts);

builder.Services.AddSingleton<IMinioClient>(_ => new MinioClient()
    .WithEndpoint(minioOpts.Endpoint)
    .WithCredentials(minioOpts.AccessKey, minioOpts.SecretKey)
    .WithSSL(minioOpts.UseSsl)
    .Build());

builder.Services.AddSingleton<MinioPresignClient>(_ =>
{
    var publicUri = TryParsePublic(minioOpts.PublicEndpoint);
    if (publicUri is null)
    {
        var fallback = new MinioClient()
            .WithEndpoint(minioOpts.Endpoint)
            .WithCredentials(minioOpts.AccessKey, minioOpts.SecretKey)
            .WithSSL(minioOpts.UseSsl)
            .Build();
        return new MinioPresignClient(fallback);
    }

    var host = publicUri.IsDefaultPort ? publicUri.Host : $"{publicUri.Host}:{publicUri.Port}";
    var client = new MinioClient()
        .WithEndpoint(host)
        .WithCredentials(minioOpts.AccessKey, minioOpts.SecretKey)
        .WithSSL(publicUri.Scheme == Uri.UriSchemeHttps)
        .Build();
    return new MinioPresignClient(client);
});

builder.Services.AddScoped<IObjectStorage, MinioObjectStorage>();

builder.Services.Configure<GuardOptions>(builder.Configuration.GetSection("Guard"));
builder.Services.AddSingleton<GuardSignatureService>();
builder.Services.AddHttpClient<IGuardClient, GuardClient>((sp, client) =>
{
    var opts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<GuardOptions>>().Value;
    client.BaseAddress = new Uri(opts.BaseUrl.TrimEnd('/') + "/");
    client.Timeout = Timeout.InfiniteTimeSpan;
});
builder.Services.AddSingleton<IGuardUploadRegistry, InMemoryGuardUploadRegistry>();
builder.Services.AddSingleton<IGuardScanStatusSync, GuardScanStatusSync>();
builder.Services.AddHttpClient(nameof(GuardScanStatusSync), (sp, client) =>
{
    var opts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<GuardOptions>>().Value;
    client.BaseAddress = new Uri(opts.BaseUrl.TrimEnd('/') + "/");
    client.Timeout = TimeSpan.FromSeconds(30);
});
builder.Services.AddScoped<IFileVettingService, GuardVettingService>();

builder.Services.AddScoped<ICurrentUser, CurrentUserAccessor>();
builder.Services.AddDijitalAtolyeJwtAuth(builder.Configuration);

builder.Services.AddDijitalAtolyeEventBus(
    builder.Configuration,
    serviceName: "storage",
    configureBus: null,
    typeof(GuardVettingConsumer).Assembly);

builder.Services.AddHealthChecks();

var app = builder.Build();
app.UseDijitalAtolyeServiceDefaults();
app.UseAuthentication();
app.UseAuthorization();
app.MapStorageEndpoints();
app.MapGuardCallbackEndpoints();
app.Run();

static Uri? TryParsePublic(string value)
{
    if (string.IsNullOrWhiteSpace(value)) return null;
    return Uri.TryCreate(value, UriKind.Absolute, out var u) ? u : null;
}

public sealed class MinioOptions
{
    public string Endpoint { get; init; } = "localhost:9000";
    public string AccessKey { get; init; } = string.Empty;
    public string SecretKey { get; init; } = string.Empty;
    public bool UseSsl { get; init; }
    /// <summary>
    /// Tarayıcının erişeceği MinIO base URL'i (örn. <c>http://localhost:9000</c> veya <c>https://example.com/cdn</c>).
    /// Boş ise <see cref="Endpoint"/> hem intranet hem presign için kullanılır (ör. tek sunucu, dış ağ olmayan kurulum).
    /// </summary>
    public string PublicEndpoint { get; init; } = string.Empty;
}
