using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Audit;
using Elastic.Clients.Elasticsearch;
using MassTransit;

namespace DijitalAtolye.Admin.API.Consumers;

public sealed class AuditIndexConsumer : IConsumer<AuditLoggedV1>
{
    public const string IndexName = "audit-entries";

    private readonly ElasticsearchClient _client;
    private readonly ILogger<AuditIndexConsumer> _logger;

    public AuditIndexConsumer(ElasticsearchClient client, ILogger<AuditIndexConsumer> logger)
    {
        _client = client;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<AuditLoggedV1> context)
    {
        var msg = context.Message;
        try
        {
            var exists = await _client.Indices.ExistsAsync(IndexName, context.CancellationToken);
            if (!exists.Exists)
            {
                await _client.Indices.CreateAsync(IndexName, context.CancellationToken);
            }

            var doc = new AuditSearchDocument
            {
                Id = msg.AuditEntryId,
                OccurredAt = msg.OccurredAt,
                ServiceName = msg.ServiceName,
                UserId = msg.UserId,
                UserName = msg.UserName,
                Action = msg.Action,
                EntityType = msg.EntityType,
                EntityId = msg.EntityId,
                PayloadJson = msg.PayloadJson,
                Severity = msg.Severity,
                IpAddress = msg.IpAddress,
                CorrelationId = msg.CorrelationId,
            };

            var resp = await _client.IndexAsync(doc, idx => idx.Index(IndexName).Id(msg.AuditEntryId.ToString()), context.CancellationToken);
            if (!resp.IsValidResponse)
                _logger.LogWarning("Audit index failed: {Err}", resp.DebugInformation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Audit ES index error for {Id}", msg.AuditEntryId);
        }
    }
}

public sealed class AuditSearchDocument
{
    public Guid Id { get; init; }
    public DateTime OccurredAt { get; init; }
    public string ServiceName { get; init; } = "";
    public Guid? UserId { get; init; }
    public string? UserName { get; init; }
    public string Action { get; init; } = "";
    public string? EntityType { get; init; }
    public string? EntityId { get; init; }
    public string? PayloadJson { get; init; }
    public string Severity { get; init; } = "Info";
    public string? IpAddress { get; init; }
    public string? CorrelationId { get; init; }
}
