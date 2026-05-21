using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Storage;
using DijitalAtolye.Content.API.Domain;
using DijitalAtolye.Content.API.Persistence;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Content.API.Consumers;

/// <summary>
/// Guard tarama durumu güncellemelerini mevcut içerik durum makinesine yansıtır.
/// Faz C'de Guard-specific state'ler eklenecek; şimdilik reddedilen dosyalar <see cref="ContentState.AutoRejected"/> olur.
/// </summary>
public sealed class GuardScanUpdatedConsumer : IConsumer<GuardScanUpdatedV1>
{
    private static readonly HashSet<string> RejectedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "clamav_infected",
        "eset_infected",
        "policy_rejected",
        "admin_rejected",
        "error",
    };

    private readonly ContentDbContext _db;
    private readonly ILogger<GuardScanUpdatedConsumer> _logger;

    public GuardScanUpdatedConsumer(ContentDbContext db, ILogger<GuardScanUpdatedConsumer> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<GuardScanUpdatedV1> context)
    {
        var msg = context.Message;
        _logger.LogInformation(
            "GuardScanUpdatedV1: ContentId={ContentId} Status={Status} GuardFileId={GuardFileId}",
            msg.ContentId, msg.Status, msg.GuardFileId);

        if (!RejectedStatuses.Contains(msg.Status))
        {
            return;
        }

        var content = await _db.Contents.FirstOrDefaultAsync(c => c.Id == msg.ContentId, context.CancellationToken);
        if (content is null)
        {
            _logger.LogWarning("Guard reddi için içerik bulunamadı: ContentId={ContentId}", msg.ContentId);
            return;
        }

        if (content.State is ContentState.AutoRejected or ContentState.Rejected)
        {
            return;
        }

        if (!content.CanTransitionTo(ContentState.AutoRejected))
        {
            _logger.LogWarning(
                "Guard reddi uygulanamadı (geçersiz geçiş): ContentId={ContentId} State={State} GuardStatus={Status}",
                msg.ContentId, content.State, msg.Status);
            return;
        }

        content.TransitionTo(ContentState.AutoRejected);
        await _db.SaveChangesAsync(context.CancellationToken);

        _logger.LogWarning(
            "Guard reddi uygulandı: ContentId={ContentId} Status={Status} Reasons={Reasons}",
            msg.ContentId, msg.Status, string.Join("; ", msg.Reasons));
    }
}
