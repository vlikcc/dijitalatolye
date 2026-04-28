namespace DijitalAtolye.Content.API.Domain;

public sealed class Content
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public required Guid AuthorUserId { get; init; }

    public required string Title { get; set; }

    public string? Description { get; set; }

    public string? Slug { get; set; }

    public string Subject { get; set; } = string.Empty;

    public int? GradeLevel { get; set; }

    public List<string> OutcomeCodes { get; set; } = [];

    public List<string> Tags { get; set; } = [];

    public ContentState State { get; set; } = ContentState.Draft;

    public Guid? CurrentVersionId { get; set; }

    public int? TargetAge { get; set; }

    public int? DurationMinutes { get; set; }

    /// <summary>"Easy" | "Medium" | "Hard"</summary>
    public string? Difficulty { get; set; }

    public string? CoverImageBucket { get; set; }
    public string? CoverImageKey { get; set; }

    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;

    public DateTime? PublishedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public string? PublishedBucket { get; set; }
    public string? PublishedKey { get; set; }

    public ICollection<ContentVersion> Versions { get; init; } = [];

    public bool CanTransitionTo(ContentState target) =>
        (State, target) switch
        {
            (ContentState.Draft, ContentState.Submitted) => true,
            (ContentState.Submitted, ContentState.AIReviewing) => true,
            (ContentState.AIReviewing, ContentState.AIReviewed) => true,
            (ContentState.AIReviewed, ContentState.EditorReviewing) => true,
            (ContentState.AIReviewed, ContentState.AutoRejected) => true,
            (ContentState.EditorReviewing, ContentState.Approved) => true,
            (ContentState.EditorReviewing, ContentState.Rejected) => true,
            (ContentState.EditorReviewing, ContentState.RevisionRequested) => true,
            (ContentState.RevisionRequested, ContentState.Draft) => true,
            (ContentState.Approved, ContentState.Published) => true,
            (ContentState.Published, ContentState.Unpublished) => true,
            (ContentState.Unpublished, ContentState.Published) => true,
            _ => false,
        };

    public void TransitionTo(ContentState target)
    {
        if (!CanTransitionTo(target))
        {
            throw new InvalidOperationException($"Geçersiz durum geçişi: {State} -> {target}");
        }
        State = target;
        UpdatedAtUtc = DateTime.UtcNow;
        if (target == ContentState.Published)
        {
            PublishedAtUtc = DateTime.UtcNow;
        }
    }
}

public enum ContentState
{
    Draft = 0,
    Submitted = 1,
    AIReviewing = 2,
    AIReviewed = 3,
    EditorReviewing = 4,
    Approved = 5,
    Rejected = 6,
    RevisionRequested = 7,
    AutoRejected = 8,
    Published = 9,
    Unpublished = 10,
}
