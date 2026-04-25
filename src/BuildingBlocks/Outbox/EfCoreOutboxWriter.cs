using System.Text.Json;
using DijitalAtolye.BuildingBlocks.EventBus.Events;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.BuildingBlocks.Outbox;

public sealed class EfCoreOutboxWriter<TDbContext> : IOutboxWriter where TDbContext : DbContext
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false,
    };

    private readonly TDbContext _dbContext;

    public EfCoreOutboxWriter(TDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task WriteAsync<TEvent>(TEvent integrationEvent, Guid? correlationId = null, CancellationToken ct = default)
        where TEvent : class, IIntegrationEvent
    {
        var message = new OutboxMessage
        {
            EventType = typeof(TEvent).FullName ?? typeof(TEvent).Name,
            Payload = JsonSerializer.Serialize(integrationEvent, SerializerOptions),
            CorrelationId = correlationId,
            OccurredOn = integrationEvent.OccurredOn,
        };

        await _dbContext.Set<OutboxMessage>().AddAsync(message, ct);
    }
}
