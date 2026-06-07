using DijitalAtolye.BuildingBlocks.EventBus.Events;

namespace DijitalAtolye.BuildingBlocks.EventBus.Contracts.Assignment;

/// <summary>
/// Bir öğrenci atanan içeriği tamamladığında yayınlanır. Notification Service öğretmeni bilgilendirir.
/// </summary>
public sealed record AssignmentCompletedV1 : IntegrationEvent
{
    public required Guid AssignmentId { get; init; }
    public required Guid TeacherUserId { get; init; }
    public required string TeacherEmail { get; init; }
    public required string StudentEmail { get; init; }
    public required string AssignmentTitle { get; init; }
    public required int? Score { get; init; }
    public required DateTime CompletedAt { get; init; }
}
