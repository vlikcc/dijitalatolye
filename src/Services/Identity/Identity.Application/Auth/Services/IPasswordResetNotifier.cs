namespace DijitalAtolye.Identity.Application.Auth.Services;

/// <summary>
/// Şifre sıfırlama tokenını ileten servis. Notification Service entegrasyonu hazır olana kadar
/// Infrastructure katmanında log tabanlı varsayılan implementasyon kullanılır.
/// </summary>
public interface IPasswordResetNotifier
{
    Task NotifyAsync(Guid userId, string email, string token, CancellationToken ct);
}
