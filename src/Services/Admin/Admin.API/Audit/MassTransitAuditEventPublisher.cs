using DijitalAtolye.BuildingBlocks.Audit;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Audit;
using MassTransit;

namespace DijitalAtolye.Admin.API.Audit;

public sealed class MassTransitAuditEventPublisher : IAuditEventPublisher
{
    private readonly IPublishEndpoint _publish;

    public MassTransitAuditEventPublisher(IPublishEndpoint publish) => _publish = publish;

    public Task PublishAsync(AuditEntry entry, CancellationToken ct = default) =>
        _publish.Publish(new AuditLoggedV1
        {
            AuditEntryId = entry.Id,
            OccurredAt = entry.OccurredAt,
            ServiceName = entry.ServiceName,
            UserId = entry.UserId,
            UserName = entry.UserName,
            Action = entry.Action,
            EntityType = entry.EntityType,
            EntityId = entry.EntityId,
            PayloadJson = entry.PayloadJson,
            Severity = entry.Severity,
            IpAddress = entry.IpAddress,
            CorrelationId = entry.CorrelationId,
        }, ct);
}
