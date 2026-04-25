namespace DijitalAtolye.BuildingBlocks.Audit;

public interface IAuditLogger
{
    Task LogAsync(AuditEntry entry, CancellationToken ct = default);

    Task LogAsync(
        string action,
        string? entityType = null,
        string? entityId = null,
        object? payload = null,
        string severity = "Info",
        CancellationToken ct = default);
}
