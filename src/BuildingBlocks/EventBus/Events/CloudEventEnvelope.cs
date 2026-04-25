namespace DijitalAtolye.BuildingBlocks.EventBus.Events;

/// <summary>
/// CloudEvents 1.0 spec uyumlu zarf. <see cref="IIntegrationEvent"/> bu zarf içine paketlenir.
/// MassTransit messaging için header'lar bu metadata ile doldurulur.
/// Bkz. https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md
/// </summary>
public sealed record CloudEventEnvelope<T>(
    string SpecVersion,
    string Id,
    string Source,
    string Type,
    string DataContentType,
    DateTimeOffset Time,
    T Data) where T : IIntegrationEvent
{
    public static CloudEventEnvelope<T> Wrap(T data, string source) =>
        new(
            SpecVersion: "1.0",
            Id: data.EventId.ToString("D"),
            Source: source,
            Type: $"tr.dijitalatolye.{typeof(T).Name}",
            DataContentType: "application/json",
            Time: data.OccurredOn,
            Data: data);
}
