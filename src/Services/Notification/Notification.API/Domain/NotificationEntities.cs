namespace DijitalAtolye.Notification.API.Domain;

public sealed class InAppNotification
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid UserId { get; init; }
    public required string Type { get; init; }
    public required string Title { get; init; }
    public required string Body { get; init; }
    public string? Link { get; init; }
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
    public DateTime? ReadAtUtc { get; set; }
}

public sealed class EmailLog
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string ToEmail { get; init; }
    public required string Subject { get; init; }
    public required string Template { get; init; }
    public DateTime SentAtUtc { get; init; } = DateTime.UtcNow;
    public bool Success { get; set; }
    public string? Error { get; set; }
}
