using DijitalAtolye.BuildingBlocks.EventBus.Events;

namespace DijitalAtolye.BuildingBlocks.EventBus.Contracts.Storage;

/// <summary>
/// Guard, admin onayı sonrası dosyayı <c>POST /api/internal/approved-files/</c> ile teslim eder.
/// Storage.API HMAC + SHA256 doğrulamasını yaptıktan sonra bunu yayınlar; Content.API içeriği
/// yayına açılabilir duruma getirir.
/// </summary>
public sealed record GuardFileDeliveredV1 : IntegrationEvent
{
    public required Guid ContentId { get; init; }

    public required Guid VersionId { get; init; }

    public required string GuardFileId { get; init; }

    /// <summary>Guard'ın imzaladığı SHA256 — Storage.API tarafında MinIO'daki versiyon hash'i ile karşılaştırıldı.</summary>
    public required string Sha256 { get; init; }

    public required long SizeBytes { get; init; }

    public string? Extension { get; init; }

    public string? MimeType { get; init; }

    public required string StorageBucket { get; init; }

    public required string StorageKey { get; init; }
}
