using DijitalAtolye.BuildingBlocks.EventBus.Events;

namespace DijitalAtolye.BuildingBlocks.EventBus.Contracts.Content;

/// <summary>
/// İçerik publish edildiğinde yayınlanır. Search Service tarafından indekslenmek üzere tüketilir.
/// </summary>
public sealed record ContentPublishedV1 : IntegrationEvent
{
    public required Guid ContentId { get; init; }
    public required Guid VersionId { get; init; }
    public required Guid AuthorUserId { get; init; }
    public required string Slug { get; init; }
    public required string Title { get; init; }
    public required string? Description { get; init; }
    public required string PlayUrl { get; init; }
    /// <summary>İçerik türü: Game | DigitalContent | EBook.</summary>
    public string Type { get; init; } = "Game";
    public required IReadOnlyCollection<string> OutcomeCodes { get; init; }
    public required IReadOnlyCollection<string> Tags { get; init; }
    public required IReadOnlyCollection<int> GradeLevels { get; init; }
    public required IReadOnlyCollection<string> Subjects { get; init; }
    public required DateTime PublishedAt { get; init; }
}
