using DijitalAtolye.BuildingBlocks.EventBus.Events;

namespace DijitalAtolye.BuildingBlocks.EventBus.Contracts.Moderation;

/// <summary>
/// AI Moderation Service bir içeriği analiz ettiğinde yayınlanır.
/// Review Service ve Content Service tarafından tüketilir.
/// </summary>
public sealed record AIModerationCompletedV1 : IntegrationEvent
{
    public required Guid ContentId { get; init; }

    public required Guid VersionId { get; init; }

    public required Guid ReportId { get; init; }

    public required ModerationDecision Decision { get; init; }

    public required int Score { get; init; }

    public required IReadOnlyCollection<string> CriticalFlags { get; init; }

    public required IReadOnlyCollection<string> Warnings { get; init; }

    public required string ProviderName { get; init; }

    public required string ProviderModel { get; init; }
}

public enum ModerationDecision
{
    AutoApproveCandidate = 1,
    NeedsReview = 2,
    FlaggedForReview = 3,
    AutoReject = 4,
}
