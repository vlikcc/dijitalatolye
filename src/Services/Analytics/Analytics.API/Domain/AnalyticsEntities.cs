namespace DijitalAtolye.Analytics.API.Domain;

public enum AnalyticsEventType
{
    View = 0,
    Play = 1,
    Complete = 2,
    Like = 3,
    Favorite = 4,
    Share = 5,
    Progress = 6,
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
    /// <summary>İçerikten gelen skor (0–100). Yalnızca Complete/Progress olaylarında dolu olur.</summary>
    public int? Score { get; set; }
    /// <summary>İlişkili MEB kazanım kodu (Content.OutcomeCodes ile uyumlu).</summary>
    public string? OutcomeCode { get; set; }
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
    /// <summary>Skoru olan olayların toplamı (ortalama = ScoreSum / ScoreCount).</summary>
    public long ScoreSum { get; set; }
    public int ScoreCount { get; set; }
}

/// <summary>
/// Kazanım (MEB outcome) × içerik × gün bazlı agregat. Kazanım-bazlı ilerleme panellerinin veri temeli.
/// </summary>
public sealed class OutcomeDailyStats
{
    public Guid ContentId { get; set; }
    public string OutcomeCode { get; set; } = string.Empty;
    public DateOnly Day { get; set; }
    public int Completes { get; set; }
    public int Progresses { get; set; }
    public long ScoreSum { get; set; }
    public int ScoreCount { get; set; }
}

/// <summary>
/// Agregasyon worker'ının checkpoint'i (tek satır). Son çalışmadan beri olay almış günler yeniden hesaplanır.
/// </summary>
public sealed class AggregationState
{
    public int Id { get; set; } = 1;
    public DateTime LastRunUtc { get; set; } = DateTime.MinValue;
}
