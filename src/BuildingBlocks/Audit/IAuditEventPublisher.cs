namespace DijitalAtolye.BuildingBlocks.Audit;

public interface IAuditEventPublisher
{
    Task PublishAsync(AuditEntry entry, CancellationToken ct = default);
}

public sealed class NullAuditEventPublisher : IAuditEventPublisher
{
    public Task PublishAsync(AuditEntry entry, CancellationToken ct = default) => Task.CompletedTask;
}
