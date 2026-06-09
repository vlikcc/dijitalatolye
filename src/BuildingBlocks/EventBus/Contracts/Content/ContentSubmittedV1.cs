using DijitalAtolye.BuildingBlocks.EventBus.Events;

namespace DijitalAtolye.BuildingBlocks.EventBus.Contracts.Content;

/// <summary>
/// Öğretmen bir içerik versiyonunu inceleme için gönderdiğinde yayınlanır.
/// AI Moderation Service tarafından tüketilir.
/// </summary>
public sealed record ContentSubmittedV1 : IntegrationEvent
{
    public required Guid ContentId { get; init; }

    public required Guid VersionId { get; init; }

    public required Guid AuthorUserId { get; init; }

    public required string ManifestEntry { get; init; }

    public required string StorageKey { get; init; }

    public required string Title { get; init; }

    public required IReadOnlyCollection<string> OutcomeCodes { get; init; }

    public required IReadOnlyCollection<string> Tags { get; init; }

    public required IReadOnlyCollection<int> GradeLevels { get; init; }

    public required IReadOnlyCollection<string> Subjects { get; init; }
}
