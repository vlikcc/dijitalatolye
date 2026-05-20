using System.Text.Json;
using DijitalAtolye.BuildingBlocks.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace DijitalAtolye.BuildingBlocks.Audit;

public sealed class EfAuditLogger : IAuditLogger
{
    private readonly AuditDbContext _db;
    private readonly ICurrentUser _currentUser;
    private readonly IHttpContextAccessor _http;
    private readonly ILogger<EfAuditLogger> _logger;
    private readonly IAuditEventPublisher _publisher;
    private readonly string _serviceName;

    public EfAuditLogger(
        AuditDbContext db,
        ICurrentUser currentUser,
        IHttpContextAccessor http,
        ILogger<EfAuditLogger> logger,
        AuditServiceContext serviceContext,
        IAuditEventPublisher? publisher = null)
    {
        _db = db;
        _currentUser = currentUser;
        _http = http;
        _logger = logger;
        _publisher = publisher ?? new NullAuditEventPublisher();
        _serviceName = serviceContext.ServiceName;
    }

    public async Task LogAsync(AuditEntry entry, CancellationToken ct = default)
    {
        try
        {
            entry.ServiceName = string.IsNullOrWhiteSpace(entry.ServiceName) ? _serviceName : entry.ServiceName;
            entry.OccurredAt = entry.OccurredAt == default ? DateTime.UtcNow : entry.OccurredAt;
            EnrichFromContext(entry);
            _db.AuditEntries.Add(entry);
            await _db.SaveChangesAsync(ct).ConfigureAwait(false);
            await _publisher.PublishAsync(entry, ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Audit log persist failed for action {Action}", entry.Action);
        }
    }

    public Task LogAsync(
        string action,
        string? entityType = null,
        string? entityId = null,
        object? payload = null,
        string severity = "Info",
        CancellationToken ct = default)
    {
        var entry = new AuditEntry
        {
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Severity = severity,
            PayloadJson = payload is null ? null : JsonSerializer.Serialize(payload),
        };
        return LogAsync(entry, ct);
    }

    private void EnrichFromContext(AuditEntry entry)
    {
        entry.UserId ??= _currentUser.UserId;
        entry.UserName ??= _currentUser.DisplayName ?? _currentUser.Email;
        var ctx = _http.HttpContext;
        if (ctx is null) return;
        entry.IpAddress ??= ctx.Connection.RemoteIpAddress?.ToString();
        entry.UserAgent ??= ctx.Request.Headers.UserAgent.ToString();
        entry.CorrelationId ??= ctx.TraceIdentifier;
    }
}

public sealed class AuditServiceContext
{
    public string ServiceName { get; init; } = "unknown";
}
