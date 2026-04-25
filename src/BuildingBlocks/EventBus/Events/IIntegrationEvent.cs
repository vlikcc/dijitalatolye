namespace DijitalAtolye.BuildingBlocks.EventBus.Events;

/// <summary>
/// Servisler arası asenkron iletişimde kullanılan event'ler için marker arayüz.
/// CloudEvents 1.0 zarfı içine sarılır.
/// </summary>
public interface IIntegrationEvent
{
    /// <summary>Event'in benzersiz kimliği. Producer üretir.</summary>
    Guid EventId { get; }

    /// <summary>Event'in oluşturulma zamanı (UTC).</summary>
    DateTime OccurredOn { get; }
}

public abstract record IntegrationEvent(Guid EventId, DateTime OccurredOn) : IIntegrationEvent
{
    protected IntegrationEvent() : this(Guid.NewGuid(), DateTime.UtcNow) { }
}
