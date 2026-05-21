using DijitalAtolye.BuildingBlocks.EventBus.Events;

namespace DijitalAtolye.BuildingBlocks.EventBus.Contracts.Storage;

[Obsolete("GuardScanUpdatedV1 kullanın. ClamAV taraması kaldırıldı.")]
public sealed record VirusDetectedV1 : IntegrationEvent
{
    public required Guid ContentId { get; init; }
    public required Guid VersionId { get; init; }
    public required string? VirusName { get; init; }
}
