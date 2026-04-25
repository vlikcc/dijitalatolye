using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Content;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Moderation;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Review;
using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.Content.API.Domain;
using DijitalAtolye.Content.API.Persistence;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Content.API.Consumers;

/// <summary>
/// AI moderation tamamlandığında durumu günceller. AutoReject ise içerik direkt reddedilir,
/// aksi halde editör inceleme aşamasına geçer.
/// </summary>
public sealed class AIModerationCompletedConsumer : IConsumer<AIModerationCompletedV1>
{
    private readonly ContentDbContext _db;
    private readonly ILogger<AIModerationCompletedConsumer> _logger;

    public AIModerationCompletedConsumer(ContentDbContext db, ILogger<AIModerationCompletedConsumer> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<AIModerationCompletedV1> context)
    {
        var msg = context.Message;
        var content = await _db.Contents.FirstOrDefaultAsync(c => c.Id == msg.ContentId, context.CancellationToken);
        if (content is null)
        {
            _logger.LogWarning("Content {ContentId} not found for AIModerationCompleted", msg.ContentId);
            return;
        }

        if (content.State == ContentState.Submitted)
        {
            content.TransitionTo(ContentState.AIReviewing);
        }
        if (content.State == ContentState.AIReviewing)
        {
            content.TransitionTo(ContentState.AIReviewed);
        }

        if (msg.Decision == ModerationDecision.AutoReject)
        {
            content.TransitionTo(ContentState.AutoRejected);
        }
        else if (content.State == ContentState.AIReviewed)
        {
            content.TransitionTo(ContentState.EditorReviewing);
        }

        await _db.SaveChangesAsync(context.CancellationToken);
    }
}

/// <summary>
/// Editör karar verince içerik durumunu günceller; onaylandıysa publish + ContentPublished yayınla.
/// </summary>
public sealed class EditorDecisionMadeConsumer : IConsumer<EditorDecisionMadeV1>
{
    private readonly ContentDbContext _db;
    private readonly IOutboxWriter _outbox;
    private readonly ILogger<EditorDecisionMadeConsumer> _logger;

    public EditorDecisionMadeConsumer(ContentDbContext db, IOutboxWriter outbox, ILogger<EditorDecisionMadeConsumer> logger)
    {
        _db = db;
        _outbox = outbox;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<EditorDecisionMadeV1> context)
    {
        var msg = context.Message;
        var content = await _db.Contents.FirstOrDefaultAsync(c => c.Id == msg.ContentId, context.CancellationToken);
        if (content is null)
        {
            _logger.LogWarning("Content {ContentId} not found for EditorDecision", msg.ContentId);
            return;
        }

        switch (msg.Decision)
        {
            case EditorDecision.Approved:
                if (content.State == ContentState.EditorReviewing)
                {
                    content.TransitionTo(ContentState.Approved);
                    if (content.CanTransitionTo(ContentState.Published))
                    {
                        content.Slug ??= GenerateSlug(content.Title);
                        content.TransitionTo(ContentState.Published);
                        await _outbox.WriteAsync(new ContentPublishedV1
                        {
                            ContentId = content.Id,
                            VersionId = content.CurrentVersionId!.Value,
                            AuthorUserId = content.AuthorUserId,
                            Slug = content.Slug,
                            Title = content.Title,
                            Description = content.Description,
                            PlayUrl = $"/play/{content.Slug}",
                            OutcomeCodes = content.OutcomeCodes.AsReadOnly(),
                            Tags = content.Tags.AsReadOnly(),
                            GradeLevel = content.GradeLevel,
                            Subject = content.Subject,
                            PublishedAt = content.PublishedAtUtc!.Value,
                        }, ct: context.CancellationToken);
                    }
                }
                break;

            case EditorDecision.Rejected:
                if (content.State == ContentState.EditorReviewing) content.TransitionTo(ContentState.Rejected);
                break;

            case EditorDecision.RevisionRequested:
                if (content.State == ContentState.EditorReviewing) content.TransitionTo(ContentState.RevisionRequested);
                break;
        }

        await _db.SaveChangesAsync(context.CancellationToken);
    }

    private static string GenerateSlug(string title)
    {
        var lower = title.ToLowerInvariant()
            .Replace("ç", "c").Replace("ğ", "g").Replace("ı", "i")
            .Replace("ö", "o").Replace("ş", "s").Replace("ü", "u");
        var sb = new System.Text.StringBuilder(lower.Length + 8);
        foreach (var c in lower)
        {
            if (char.IsLetterOrDigit(c)) sb.Append(c);
            else if (sb.Length == 0 || sb[^1] != '-') sb.Append('-');
        }
        return sb.ToString().Trim('-') + "-" + Convert.ToHexString(Guid.NewGuid().ToByteArray()[..3]).ToLowerInvariant();
    }
}
