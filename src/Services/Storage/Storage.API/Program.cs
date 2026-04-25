using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.WebHostExtensions;
using DijitalAtolye.Storage.API.Antivirus;
using DijitalAtolye.Storage.API.Endpoints;
using DijitalAtolye.Storage.API.Storage;
using Minio;
using nClam;

var builder = WebApplication.CreateBuilder(args);

builder.AddDijitalAtolyeServiceDefaults("storage");

var minioOpts = builder.Configuration.GetSection("Minio").Get<MinioOptions>()
    ?? throw new InvalidOperationException("Minio configuration missing.");

builder.Services.AddMinio(c => c
    .WithEndpoint(minioOpts.Endpoint)
    .WithCredentials(minioOpts.AccessKey, minioOpts.SecretKey)
    .WithSSL(minioOpts.UseSsl)
    .Build());

builder.Services.AddScoped<IObjectStorage, MinioObjectStorage>();

var clamHost = builder.Configuration["ClamAv:Host"] ?? "localhost";
var clamPort = builder.Configuration.GetValue("ClamAv:Port", 3310);
builder.Services.AddSingleton<IClamClient>(_ => new ClamClient(clamHost, clamPort) { MaxStreamSize = 256 * 1024 * 1024 });
builder.Services.AddScoped<IAntivirusScanner, ClamAvScanner>();

builder.Services.AddScoped<ICurrentUser, CurrentUserAccessor>();
builder.Services.AddDijitalAtolyeJwtAuth(builder.Configuration);

builder.Services.AddHealthChecks();

var app = builder.Build();
app.UseDijitalAtolyeServiceDefaults();
app.UseAuthentication();
app.UseAuthorization();
app.MapStorageEndpoints();
app.Run();

internal sealed class MinioOptions
{
    public string Endpoint { get; init; } = "localhost:9000";
    public string AccessKey { get; init; } = string.Empty;
    public string SecretKey { get; init; } = string.Empty;
    public bool UseSsl { get; init; }
}
