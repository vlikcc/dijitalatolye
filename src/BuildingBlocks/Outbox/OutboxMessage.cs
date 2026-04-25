namespace DijitalAtolye.BuildingBlocks.Outbox;

/// <summary>
/// Transactional Outbox pattern. Bir aggregate değişikliği ile aynı transaction içinde
/// yazılır; arka plan dispatcher mesajı broker'a gönderdikten sonra <see cref="ProcessedAt"/>
/// işaretler.
/// </summary>
public sealed class OutboxMessage
{
    public Guid Id { get; init; } = Guid.NewGuid();

    /// <summary>Event'in tip ismi (e.g. "ContentSubmittedV1"). Consumer routing için kullanılır.</summary>
    public required string EventType { get; init; }

    /// <summary>JSON serialize edilmiş event payload'ı.</summary>
    public required string Payload { get; init; }

    /// <summary>Saga / trace correlation için.</summary>
    public Guid? CorrelationId { get; init; }

    public DateTime OccurredOn { get; init; } = DateTime.UtcNow;

    public DateTime? ProcessedAt { get; set; }

    public string? Error { get; set; }

    public int RetryCount { get; set; }
}
