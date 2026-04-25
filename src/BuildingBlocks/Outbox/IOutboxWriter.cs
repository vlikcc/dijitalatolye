using DijitalAtolye.BuildingBlocks.EventBus.Events;

namespace DijitalAtolye.BuildingBlocks.Outbox;

/// <summary>
/// Domain logic, integration event'i transaction içinde Outbox tablosuna yazmak için bunu kullanır.
/// </summary>
public interface IOutboxWriter
{
    Task WriteAsync<TEvent>(TEvent integrationEvent, Guid? correlationId = null, CancellationToken ct = default)
        where TEvent : class, IIntegrationEvent;
}
