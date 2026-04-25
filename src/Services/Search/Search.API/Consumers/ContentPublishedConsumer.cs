using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Content;
using DijitalAtolye.Search.API.Domain;
using DijitalAtolye.Search.API.Index;
using MassTransit;

namespace DijitalAtolye.Search.API.Consumers;

public sealed class ContentPublishedSearchConsumer : IConsumer<ContentPublishedV1>
{
    private readonly ISearchIndexer _indexer;

    public ContentPublishedSearchConsumer(ISearchIndexer indexer) => _indexer = indexer;

    public Task Consume(ConsumeContext<ContentPublishedV1> ctx)
    {
        var m = ctx.Message;
        var doc = new ContentSearchDocument
        {
            Id = m.ContentId,
            ContentId = m.ContentId,
            Title = m.Title,
            Description = m.Description,
            Slug = m.Slug,
            Subject = m.Subject,
            GradeLevel = m.GradeLevel,
            OutcomeCodes = m.OutcomeCodes,
            Tags = m.Tags,
            PublishedAt = m.PublishedAt,
            Popularity = 1.0,
        };
        return _indexer.IndexAsync(doc, ctx.CancellationToken);
    }
}
