using System.Net;
using System.Text.Json;
using DijitalAtolye.Notification.API.Persistence;
using Microsoft.EntityFrameworkCore;
using WebPush;

namespace DijitalAtolye.Notification.API.Push;

public sealed class VapidOptions
{
    public string PublicKey { get; set; } = string.Empty;
    public string PrivateKey { get; set; } = string.Empty;
    public string Subject { get; set; } = "mailto:admin@dijitalatolye.local";
}

public interface IPushSender
{
    bool Enabled { get; }
    string PublicKey { get; }
    Task SendToUserAsync(Guid userId, string title, string body, string? link, string type, CancellationToken ct = default);
}

/// <summary>
/// Kullanıcının web-push aboneliklerine (VAPID) bildirim gönderir. Süresi dolmuş abonelikleri (404/410) temizler.
/// VAPID anahtarları yoksa devre dışı (no-op).
/// </summary>
public sealed class WebPushSender : IPushSender
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private readonly NotificationDbContext _db;
    private readonly VapidOptions _opts;
    private readonly ILogger<WebPushSender> _logger;
    private readonly WebPushClient _client = new();

    public WebPushSender(NotificationDbContext db, Microsoft.Extensions.Options.IOptions<VapidOptions> opts, ILogger<WebPushSender> logger)
    {
        _db = db;
        _opts = opts.Value;
        _logger = logger;
    }

    public bool Enabled => !string.IsNullOrWhiteSpace(_opts.PublicKey) && !string.IsNullOrWhiteSpace(_opts.PrivateKey);
    public string PublicKey => _opts.PublicKey;

    public async Task SendToUserAsync(Guid userId, string title, string body, string? link, string type, CancellationToken ct = default)
    {
        if (!Enabled) return;

        var subs = await _db.PushSubscriptions.Where(s => s.UserId == userId).ToListAsync(ct);
        if (subs.Count == 0) return;

        var payload = JsonSerializer.Serialize(new { title, body, link, type }, Json);
        var vapid = new VapidDetails(_opts.Subject, _opts.PublicKey, _opts.PrivateKey);
        var expired = new List<Domain.PushSubscriptionEntity>();

        foreach (var s in subs)
        {
            try
            {
                await _client.SendNotificationAsync(new WebPush.PushSubscription(s.Endpoint, s.P256dh, s.Auth), payload, vapid, ct);
            }
            catch (WebPushException ex) when (ex.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Gone)
            {
                expired.Add(s); // abonelik artık geçerli değil
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Web push gönderilemedi (user {UserId})", userId);
            }
        }

        if (expired.Count > 0)
        {
            _db.PushSubscriptions.RemoveRange(expired);
            await _db.SaveChangesAsync(ct);
        }
    }
}
