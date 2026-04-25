using DijitalAtolye.BuildingBlocks.EventBus.Events;

namespace DijitalAtolye.BuildingBlocks.EventBus.Contracts.Review;

/// <summary>
/// Bir editör inceleme kararı verdiğinde yayınlanır.
/// Content Service ve Notification Service tarafından tüketilir.
/// </summary>
public sealed record EditorDecisionMadeV1 : IntegrationEvent
{
    public required Guid ContentId { get; init; }

    public required Guid VersionId { get; init; }

    public required Guid EditorUserId { get; init; }

    public required EditorDecision Decision { get; init; }

    public required string? Comment { get; init; }
}

public enum EditorDecision
{
    Approved = 1,
    Rejected = 2,
    RevisionRequested = 3,
}
