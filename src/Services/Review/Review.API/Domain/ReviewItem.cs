using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Moderation;

namespace DijitalAtolye.Review.API.Domain;

public sealed class ReviewItem
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid ContentId { get; init; }
    public required Guid VersionId { get; init; }
    public required Guid AuthorUserId { get; init; }
    public required Guid AIReportId { get; init; }
    public required ModerationDecision AIDecision { get; init; }
    public int AIScore { get; init; }
    public required string Title { get; init; }

    public ReviewStatus Status { get; set; } = ReviewStatus.Queued;
    public Guid? AssignedEditorId { get; set; }
    public DijitalAtolye.BuildingBlocks.EventBus.Contracts.Review.EditorDecision? Decision { get; set; }
    public string? Comment { get; set; }

    public DateTime EnqueuedAtUtc { get; init; } = DateTime.UtcNow;
    public DateTime? AssignedAtUtc { get; set; }
    public DateTime? DecidedAtUtc { get; set; }

    /// <summary>Öncelik skoru: yüksek = öncelik. AI skoru + bekleme süresi katkısı.</summary>
    public int Priority { get; set; }
}

public enum ReviewStatus
{
    Queued = 0,
    Assigned = 1,
    Decided = 2,
    Cancelled = 3,
}
