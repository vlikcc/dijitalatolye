namespace DijitalAtolye.User.API.Domain;

public sealed class UserCollection
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public ICollection<CollectionItem> Items { get; set; } = [];
}

public sealed class CollectionItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CollectionId { get; set; }
    public Guid ContentId { get; set; }
    public DateTime AddedAtUtc { get; set; } = DateTime.UtcNow;
}

public sealed class NotificationPreference
{
    public Guid UserId { get; set; }
    public bool EmailEnabled { get; set; } = true;
    public bool InAppEnabled { get; set; } = true;
    public bool ContentUpdates { get; set; } = true;
    public bool MarketingEmails { get; set; }
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
