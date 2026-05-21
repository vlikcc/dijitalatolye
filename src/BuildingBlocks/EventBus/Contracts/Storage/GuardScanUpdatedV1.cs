using DijitalAtolye.BuildingBlocks.EventBus.Events;

namespace DijitalAtolye.BuildingBlocks.EventBus.Contracts.Storage;

/// <summary>
/// Guard'ın <c>POST /api/internal/scan-callback/</c> uç noktasına bıraktığı durum güncellemesinin
/// integration event yansıması. Storage.API HMAC doğrulamasından sonra bunu yayınlar; Content.API
/// içerik durumunu Guard state machine'ine göre günceller.
/// </summary>
public sealed record GuardScanUpdatedV1 : IntegrationEvent
{
    public required Guid ContentId { get; init; }

    public required Guid VersionId { get; init; }

    /// <summary>Guard'ın atadığı dosya kimliği (UUID).</summary>
    public required string GuardFileId { get; init; }

    /// <summary>
    /// Guard state'i — <c>pending_scan</c>, <c>scanning</c>, <c>clean</c>, <c>yara_manual_review</c>,
    /// <c>manual_review</c>, <c>admin_approved</c>, <c>delivering</c>, <c>delivered_to_main_site</c>,
    /// <c>delivery_failed</c>, <c>policy_rejected</c>, <c>clamav_infected</c>, <c>eset_infected</c>,
    /// <c>admin_rejected</c>, <c>error</c>.
    /// </summary>
    public required string Status { get; init; }

    /// <summary>Opsiyonel — Guard'ın verdict gerekçesi (örn. virüs adı veya politika kuralı).</summary>
    public IReadOnlyList<string> Reasons { get; init; } = Array.Empty<string>();

    public DateTime ScannedAtUtc { get; init; } = DateTime.UtcNow;
}
