namespace DijitalAtolye.User.API.Domain;

public enum AssignmentStatus
{
    Active = 0,
    Closed = 1,
}

/// <summary>
/// Öğretmenin bir içeriği öğrencilere atamasını temsil eder. Öğrenciler katılım kodu (JoinCode) ile katılır.
/// </summary>
public sealed class Assignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required Guid TeacherUserId { get; set; }
    public Guid? ClassId { get; set; }
    public required Guid ContentId { get; set; }
    public string ContentTitle { get; set; } = string.Empty;
    public string? ContentSlug { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public DateTime? DueAtUtc { get; set; }
    public required string JoinCode { get; set; }
    public AssignmentStatus Status { get; set; } = AssignmentStatus.Active;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public ICollection<AssignmentMember> Members { get; set; } = [];
}

public sealed class AssignmentMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AssignmentId { get; set; }
    public Guid StudentUserId { get; set; }
    public string StudentEmail { get; set; } = string.Empty;
    public DateTime JoinedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAtUtc { get; set; }
    public int? BestScore { get; set; }
    /// <summary>Son-tarih hatırlatması gönderildiği an (dedup; null = henüz gönderilmedi).</summary>
    public DateTime? ReminderSentAtUtc { get; set; }
}
