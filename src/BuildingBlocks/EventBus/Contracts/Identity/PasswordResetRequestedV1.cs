using DijitalAtolye.BuildingBlocks.EventBus.Events;

namespace DijitalAtolye.BuildingBlocks.EventBus.Contracts.Identity;

/// <summary>
/// Şifre sıfırlama bağlantısı gönderilmesi gerektiğinde yayınlanır.
/// Notification Service tarafından tüketilir.
/// </summary>
public sealed record PasswordResetRequestedV1 : IntegrationEvent
{
    public required Guid UserId { get; init; }
    public required string Email { get; init; }
    public required string Token { get; init; }
}
