using DijitalAtolye.BuildingBlocks.EventBus.Events;

namespace DijitalAtolye.BuildingBlocks.EventBus.Contracts.Audit;

public sealed record AuditLoggedV1 : IntegrationEvent
{
    public required Guid AuditEntryId { get; init; }
    public required DateTime OccurredAt { get; init; }
    public required string ServiceName { get; init; }
    public Guid? UserId { get; init; }
    public string? UserName { get; init; }
    public required string Action { get; init; }
    public string? EntityType { get; init; }
    public string? EntityId { get; init; }
    public string? PayloadJson { get; init; }
    public string Severity { get; init; } = "Info";
    public string? IpAddress { get; init; }
    public string? CorrelationId { get; init; }
}
