using System.Security.Claims;
using System.Threading.RateLimiting;
using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.WebHostExtensions;

var builder = WebApplication.CreateBuilder(args);

builder.AddDijitalAtolyeServiceDefaults("api-gateway");
// İçerik paketleri 50 MB'a kadar (BundleValidator); Kestrel varsayılanı 30 MB olduğu için multipart payıyla 60 MB.
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 60L * 1024 * 1024);

builder.Services.AddDijitalAtolyeJwtAuth(builder.Configuration);

builder.Services.AddAuthorization(authz =>
{
    authz.AddPolicy("RequireAuthenticatedUser", p => p.RequireAuthenticatedUser());
});

builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins(builder.Configuration["Cors:Origins"]?.Split(',') ?? ["http://localhost:5173"])
    .AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

// Okullarda bir sınıfın tamamı tek NAT IP'si arkasından gelir: kimliği doğrulanmış istekler kullanıcıya,
// anonim istekler IP'ye göre bölünür ve IP limitleri sınıf ölçeğine göre ayarlanır.
static string PartitionKey(HttpContext http)
{
    var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? http.User.FindFirstValue("sub");
    return userId is not null ? $"u:{userId}" : $"ip:{http.Connection.RemoteIpAddress?.ToString() ?? "anon"}";
}

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;

    // /api/auth/* (login, register, refresh, me...) — brute-force'a karşı Identity ayrıca login'i sınırlar
    // ve 5 hatalı denemede hesabı kilitler.
    options.AddPolicy("auth-strict", http =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: PartitionKey(http),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true,
            }));

    options.AddPolicy("upload", http =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: PartitionKey(http),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 5,
                AutoReplenishment = true,
            }));

    // AI Oyun Stüdyosu yazma istekleri (/api/contents/studio POST/PUT): her biri EVREN'de dakikalar süren
    // üretim başlatabilir. Asıl sınır servisteki günlük kota + tek aktif tur kuralıdır; bu, ani patlamaya karşı.
    options.AddPolicy("ai-generate", http =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: PartitionKey(http),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true,
            }));

    options.GlobalLimiter =PartitionedRateLimiter.Create<HttpContext, string>(http =>
    {
        var key = PartitionKey(http);
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: key,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                // Kullanıcı başına 300/dk; anonim IP (tüm sınıf) için 1500/dk
                PermitLimit = key.StartsWith("u:", StringComparison.Ordinal) ? 300 : 1500,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true,
            });
    });
});

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseDijitalAtolyeServiceDefaults();
app.UseCors();
// Rate limiter kullanıcı kimliğine göre bölümlediği için authentication'dan sonra çalışmalı.
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

app.MapReverseProxy();

app.Run();
