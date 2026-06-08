using DijitalAtolye.BuildingBlocks.EventBus.Events;

namespace DijitalAtolye.BuildingBlocks.EventBus.Contracts.Assignment;

/// <summary>
/// Bir öğrencinin tamamlamadığı ödevin son tarihi yaklaştığında yayınlanır. Notification öğrenciyi hatırlatır.
/// </summary>
public sealed record AssignmentReminderV1 : IntegrationEvent
{
    public required Guid AssignmentId { get; init; }
    public required Guid StudentUserId { get; init; }
    public required string StudentEmail { get; init; }
    public required string AssignmentTitle { get; init; }
    public required string? ContentSlug { get; init; }
    public required DateTime? DueAtUtc { get; init; }
}
