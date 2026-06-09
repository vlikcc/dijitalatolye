using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Content;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Moderation;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Review;
using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.Content.API.Bundles;
using DijitalAtolye.Content.API.Domain;
using DijitalAtolye.Content.API.Persistence;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Minio;
using Minio.DataModel.Args;

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
            content.AutoRejectReason = BuildAiRejectReason(msg.CriticalFlags, msg.Score);
            content.TransitionTo(ContentState.AutoRejected);
        }
        else if (content.State == ContentState.AIReviewed)
        {
            content.TransitionTo(ContentState.EditorReviewing);
        }

        await _db.SaveChangesAsync(context.CancellationToken);
    }

    /// <summary>AI moderasyon kritik bayraklarını + skoru panelde gösterilecek Türkçe özete çevirir.</summary>
    private static string BuildAiRejectReason(IReadOnlyCollection<string> criticalFlags, int score)
    {
        var flags = criticalFlags?.Where(f => !string.IsNullOrWhiteSpace(f)).ToArray() ?? Array.Empty<string>();
        var baseMsg = "AI moderasyonu içeriği uygun bulmadı";
        return flags.Length == 0
            ? $"{baseMsg} (risk skoru: {score})"
            : $"{baseMsg}: {string.Join("; ", flags)} (risk skoru: {score})";
    }
}

/// <summary>
/// Editör karar verince içerik durumunu günceller; onaylandıysa publish + ContentPublished yayınla.
/// </summary>
public sealed class EditorDecisionMadeConsumer : IConsumer<EditorDecisionMadeV1>
{
    private readonly ContentDbContext _db;
    private readonly IOutboxWriter _outbox;
    private readonly BundleExtractor _extractor;
    private readonly IConfiguration _config;
    private readonly ILogger<EditorDecisionMadeConsumer> _logger;

    public EditorDecisionMadeConsumer(
        ContentDbContext db,
        IOutboxWriter outbox,
        BundleExtractor extractor,
        IConfiguration config,
        ILogger<EditorDecisionMadeConsumer> logger)
    {
        _db = db;
        _outbox = outbox;
        _extractor = extractor;
        _config = config;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<EditorDecisionMadeV1> context)
    {
        var msg = context.Message;
        var content = await _db.Contents.Include(c => c.Versions)
            .FirstOrDefaultAsync(c => c.Id == msg.ContentId, context.CancellationToken);
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
                        await PublishCopyAsync(content, context.CancellationToken);
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
                            Type = content.Type.ToString(),
                            OutcomeCodes = content.OutcomeCodes.AsReadOnly(),
                            Tags = content.Tags.AsReadOnly(),
                            GradeLevels = content.GradeLevels.AsReadOnly(),
                            Subjects = content.Subjects.AsReadOnly(),
                            PublishedAt = content.PublishedAtUtc!.Value,
                        }, ct: context.CancellationToken);
                        DijitalAtolye.BuildingBlocks.WebHostExtensions.DomainMetrics.ContentPublished.Add(1);
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

    private async Task PublishCopyAsync(Domain.Content content, CancellationToken ct)
    {
        if (content.CurrentVersionId is null) return;
        var version = content.Versions.FirstOrDefault(v => v.Id == content.CurrentVersionId);
        if (version is null) return;

        var publishedBucket = _config["Minio:BucketPublished"] ?? "dijitalatolye-content-published";
        var publishedPrefix = $"{content.Id:N}/{version.Id:N}";

        try
        {
            var result = await _extractor.ExtractToPublishedAsync(
                version.StorageBucket,
                version.StorageKey,
                version.ManifestEntry,
                publishedBucket,
                publishedPrefix,
                ct);

            content.PublishedBucket = publishedBucket;
            content.PublishedKey = result.EntryKey;
            _logger.LogInformation("Bundle yayına extract edildi: {Files} dosya, entry={Entry}", result.FileCount, result.EntryKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Yayın extract başarısız: {Bucket}/{Prefix}", publishedBucket, publishedPrefix);
            // Yayını engellememek adına orijinal bucket'taki anahtara fallback play endpoint'inde uygulanır.
        }
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
