namespace DijitalAtolye.Analytics.API.Domain;

public enum AnalyticsEventType
{
    View = 0,
    Play = 1,
    Complete = 2,
    Like = 3,
    Favorite = 4,
    Share = 5,
}

/// <summary>
/// Tek bir analytics olayı (ham). PRD §5.7 - view/play/duration tracking.
/// </summary>
public sealed class AnalyticsEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ContentId { get; set; }
    public Guid? UserId { get; set; }
    public string? AnonymousSessionId { get; set; }
    public AnalyticsEventType Type { get; set; }
    public int? DurationSeconds { get; set; }
    public string? Source { get; set; }
    public string? UserAgent { get; set; }
    public string? IpHash { get; set; }
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Günlük agregat (ön-hesaplanmış) - dashboard için hızlı sorgu.
/// </summary>
public sealed class ContentDailyStats
{
    public Guid ContentId { get; set; }
    public DateOnly Day { get; set; }
    public int Views { get; set; }
    public int Plays { get; set; }
    public int Completes { get; set; }
    public int Likes { get; set; }
    public int Favorites { get; set; }
    public int Shares { get; set; }
    public long TotalDurationSeconds { get; set; }
}
