using DijitalAtolye.BuildingBlocks.EventBus.Events;

namespace DijitalAtolye.BuildingBlocks.EventBus.Contracts.Identity;

/// <summary>
/// Yeni kullanıcı kaydı oluştuğunda yayınlanır.
/// User Service ve Notification Service tarafından tüketilir.
/// </summary>
public sealed record UserRegisteredV1 : IntegrationEvent
{
    public required Guid UserId { get; init; }
    public required string Email { get; init; }
    public required string DisplayName { get; init; }
    public required string PrimaryRole { get; init; }
}
