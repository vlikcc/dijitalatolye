using DijitalAtolye.BuildingBlocks.EventBus.Events;

namespace DijitalAtolye.BuildingBlocks.EventBus.Contracts.Storage;

public sealed record FileUploadedV1 : IntegrationEvent
{
    public required Guid ContentId { get; init; }
    public required Guid VersionId { get; init; }
    public required string Bucket { get; init; }
    public required string Key { get; init; }
}
