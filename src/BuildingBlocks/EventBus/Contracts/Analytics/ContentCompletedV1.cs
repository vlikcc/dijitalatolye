using DijitalAtolye.BuildingBlocks.EventBus.Events;

namespace DijitalAtolye.BuildingBlocks.EventBus.Contracts.Analytics;

/// <summary>
/// Giriş yapmış bir kullanıcı bir içeriği tamamladığında (Complete olayı) yayınlanır.
/// Ödev tamamlanmasını işaretlemek için User Service tarafından tüketilir.
/// </summary>
public sealed record ContentCompletedV1 : IntegrationEvent
{
    public required Guid ContentId { get; init; }
    public required Guid UserId { get; init; }
    public required int? Score { get; init; }
    public required DateTime CompletedAt { get; init; }
}
