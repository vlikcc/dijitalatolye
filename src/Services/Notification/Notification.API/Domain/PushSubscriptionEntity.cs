namespace DijitalAtolye.Notification.API.Domain;

/// <summary>
/// Bir kullanıcının tarayıcı web-push aboneliği (VAPID). Endpoint + P256DH/Auth anahtarları ile push gönderilir.
/// </summary>
public sealed class PushSubscriptionEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public required string Endpoint { get; set; }
    public required string P256dh { get; set; }
    public required string Auth { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
