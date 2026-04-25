using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Moderation;
using DijitalAtolye.Review.API.Domain;
using DijitalAtolye.Review.API.Persistence;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Review.API.Consumers;

/// <summary>
/// AI moderation tamamlandığında inceleme kuyruğuna ekler. AutoReject ise kuyruğa eklenmez.
/// </summary>
public sealed class AIModerationCompletedConsumer : IConsumer<AIModerationCompletedV1>
{
    private readonly ReviewDbContext _db;
    private readonly ILogger<AIModerationCompletedConsumer> _logger;

    public AIModerationCompletedConsumer(ReviewDbContext db, ILogger<AIModerationCompletedConsumer> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<AIModerationCompletedV1> context)
    {
        var msg = context.Message;
        if (msg.Decision == ModerationDecision.AutoReject)
        {
            _logger.LogInformation("AutoReject geldiğinden kuyruğa eklenmedi: {ContentId}", msg.ContentId);
            return;
        }

        var existing = await _db.ReviewItems.AnyAsync(r => r.ContentId == msg.ContentId && r.VersionId == msg.VersionId, context.CancellationToken);
        if (existing) return;

        var priority = msg.Decision switch
        {
            ModerationDecision.AutoApproveCandidate => msg.Score,
            ModerationDecision.NeedsReview => msg.Score + 20,
            ModerationDecision.FlaggedForReview => msg.Score + 50,
            _ => msg.Score,
        };

        _db.ReviewItems.Add(new ReviewItem
        {
            ContentId = msg.ContentId,
            VersionId = msg.VersionId,
            AuthorUserId = Guid.Empty,
            AIReportId = msg.ReportId,
            AIDecision = msg.Decision,
            AIScore = msg.Score,
            Title = $"İçerik {msg.ContentId.ToString()[..8]}",
            Priority = priority,
        });
        await _db.SaveChangesAsync(context.CancellationToken);
    }
}
