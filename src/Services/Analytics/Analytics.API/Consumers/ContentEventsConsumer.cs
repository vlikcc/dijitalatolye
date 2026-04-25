using DijitalAtolye.Analytics.API.Domain;
using DijitalAtolye.Analytics.API.Persistence;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Content;
using MassTransit;

namespace DijitalAtolye.Analytics.API.Consumers;

public sealed class ContentPublishedConsumer : IConsumer<ContentPublishedV1>
{
    private readonly AnalyticsDbContext _db;

    public ContentPublishedConsumer(AnalyticsDbContext db) => _db = db;

    public async Task Consume(ConsumeContext<ContentPublishedV1> ctx)
    {
        _db.Events.Add(new AnalyticsEvent
        {
            ContentId = ctx.Message.ContentId,
            Type = AnalyticsEventType.View,
            Source = "system:published",
            OccurredAt = DateTime.UtcNow,
            DurationSeconds = 0,
        });
        await _db.SaveChangesAsync(ctx.CancellationToken);
    }
}
