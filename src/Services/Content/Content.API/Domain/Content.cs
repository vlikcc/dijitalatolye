namespace DijitalAtolye.Content.API.Domain;

public sealed class Content
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public required Guid AuthorUserId { get; init; }

    public required string Title { get; set; }

    /// <summary>İçerik türü: Oyun, Dijital İçerik veya e-Kitap.</summary>
    public ContentType Type { get; set; } = ContentType.Game;

    public string? Description { get; set; }

    public string? Slug { get; set; }

    /// <summary>İçeriğin ilişkili dersler (ör. Matematik, Türkçe).</summary>
    public List<string> Subjects { get; set; } = [];

    /// <summary>İçeriğin ilişkili sınıf seviyeleri (1–12).</summary>
    public List<int> GradeLevels { get; set; } = [];

    public List<string> OutcomeCodes { get; set; } = [];

    public List<string> Tags { get; set; } = [];

    public ContentState State { get; set; } = ContentState.Draft;

    /// <summary>Otomatik red (Guard taraması veya AI moderasyonu) gerekçesi; panelde gösterilir. AutoRejected dışındaki durumlarda null.</summary>
    public string? AutoRejectReason { get; set; }

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

    /// <summary>İçerik oluşturulurken yakalanan AI metadata önerisi (serileştirilmiş). Editör inceleme karşılaştırması için.</summary>
    public string? AiSuggestionJson { get; set; }

    public ICollection<ContentVersion> Versions { get; init; } = [];

    public bool CanTransitionTo(ContentState target) =>
        (State, target) switch
        {
            // Submit: Guard temiz değilse önce tarama beklenir; temizse doğrudan Submitted.
            (ContentState.Draft, ContentState.GuardScanning) => true,
            (ContentState.Draft, ContentState.Submitted) => true,
            (ContentState.GuardScanning, ContentState.Submitted) => true,
            (ContentState.Submitted, ContentState.AIReviewing) => true,
            (ContentState.AIReviewing, ContentState.AIReviewed) => true,
            (ContentState.AIReviewed, ContentState.EditorReviewing) => true,
            // Guard reddi pre-publish state'lerde AutoRejected yapılır.
            (ContentState.Draft, ContentState.AutoRejected) => true,
            (ContentState.GuardScanning, ContentState.AutoRejected) => true,
            (ContentState.Submitted, ContentState.AutoRejected) => true,
            (ContentState.AIReviewing, ContentState.AutoRejected) => true,
            (ContentState.AIReviewed, ContentState.AutoRejected) => true,
            (ContentState.EditorReviewing, ContentState.AutoRejected) => true,
            (ContentState.EditorReviewing, ContentState.Approved) => true,
            (ContentState.EditorReviewing, ContentState.Rejected) => true,
            (ContentState.EditorReviewing, ContentState.RevisionRequested) => true,
            (ContentState.RevisionRequested, ContentState.Draft) => true,
            (ContentState.AutoRejected, ContentState.Draft) => true,
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

/// <summary>İçerik türü ayrımı. Üçü de aynı bundle/moderasyon akışından geçer.</summary>
public enum ContentType
{
    /// <summary>Satranç, mangala, zeka oyunları vb. Kazanım opsiyonel.</summary>
    Game = 0,
    /// <summary>Kazanım-tabanlı dijital içerik. En az bir kazanım zorunlu.</summary>
    DigitalContent = 1,
    /// <summary>e-Kitap. Kazanım opsiyonel.</summary>
    EBook = 2,
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
    /// <summary>Öğretmen gönderdi; Guard taraması tamamlanana kadar AI moderasyonu bekler.</summary>
    GuardScanning = 11,
}
