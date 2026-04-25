namespace DijitalAtolye.Content.API.Domain;

public sealed class ContentVersion
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public required Guid ContentId { get; init; }

    public required int VersionNumber { get; init; }

    public required string StorageBucket { get; init; }

    public required string StorageKey { get; init; }

    /// <summary>İçerik girişi (örn. <c>index.html</c>). manifest.json'dan okunur.</summary>
    public required string ManifestEntry { get; set; }

    public string? ManifestJson { get; set; }

    public long FileSizeBytes { get; set; }

    public string? Sha256 { get; set; }

    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;

    public Guid CreatedByUserId { get; init; }

    public string? ChangeLog { get; set; }
}
