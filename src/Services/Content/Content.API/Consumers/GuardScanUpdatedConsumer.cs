using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Storage;
using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.Content.API.Domain;
using DijitalAtolye.Content.API.Persistence;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Content.API.Consumers;

/// <summary>
/// Guard tarama durumunu versiyona yazar. Reddedilen dosyalar <see cref="ContentState.AutoRejected"/> olur.
/// Temiz (<c>clean</c>) sonuç + <see cref="ContentState.GuardScanning"/> ise AI moderasyonu tetiklenir
/// (<see cref="BuildingBlocks.EventBus.Contracts.Content.ContentSubmittedV1"/>).
/// </summary>
public sealed class GuardScanUpdatedConsumer : IConsumer<GuardScanUpdatedV1>
{
    private readonly ContentDbContext _db;
    private readonly IOutboxWriter _outbox;
    private readonly ILogger<GuardScanUpdatedConsumer> _logger;

    public GuardScanUpdatedConsumer(
        ContentDbContext db,
        IOutboxWriter outbox,
        ILogger<GuardScanUpdatedConsumer> logger)
    {
        _db = db;
        _outbox = outbox;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<GuardScanUpdatedV1> context)
    {
        var msg = context.Message;
        var ct = context.CancellationToken;

        _logger.LogInformation(
            "GuardScanUpdatedV1: ContentId={ContentId} VersionId={VersionId} Status={Status} GuardFileId={GuardFileId}",
            msg.ContentId, msg.VersionId, msg.Status, msg.GuardFileId);

        var version = await _db.Versions.FirstOrDefaultAsync(v => v.Id == msg.VersionId, ct);
        if (version is null)
        {
            _logger.LogWarning("Guard callback için versiyon bulunamadı: VersionId={VersionId}", msg.VersionId);
            return;
        }

        version.GuardFileId = msg.GuardFileId;
        version.GuardScanStatus = msg.Status;
        version.GuardScannedAtUtc = msg.ScannedAtUtc;

        var content = await _db.Contents.FirstOrDefaultAsync(c => c.Id == msg.ContentId, ct);
        if (content is null)
        {
            _logger.LogWarning("Guard callback için içerik bulunamadı: ContentId={ContentId}", msg.ContentId);
            await _db.SaveChangesAsync(ct);
            return;
        }

        // Eski versiyon callback'leri mevcut sürümü etkilemesin.
        if (content.CurrentVersionId != msg.VersionId)
        {
            _logger.LogDebug(
                "Guard callback güncel versiyon değil, yalnızca versiyon kaydı güncellendi: ContentId={ContentId} VersionId={VersionId}",
                msg.ContentId, msg.VersionId);
            await _db.SaveChangesAsync(ct);
            return;
        }

        if (GuardScanStatuses.IsRejected(msg.Status))
        {
            await ApplyGuardRejectionAsync(content, msg, ct);
            return;
        }

        if (GuardScanStatuses.IsCleanForAiModeration(msg.Status)
            && content.State == ContentState.GuardScanning)
        {
            await ReleaseToAiModerationAsync(content, version, ct);
            return;
        }

        await _db.SaveChangesAsync(ct);
    }

    private async Task ApplyGuardRejectionAsync(Domain.Content content, GuardScanUpdatedV1 msg, CancellationToken ct)
    {
        if (content.State is ContentState.AutoRejected or ContentState.Rejected)
        {
            await _db.SaveChangesAsync(ct);
            return;
        }

        if (!content.CanTransitionTo(ContentState.AutoRejected))
        {
            _logger.LogWarning(
                "Guard reddi uygulanamadı (geçersiz geçiş): ContentId={ContentId} State={State} GuardStatus={Status}",
                msg.ContentId, content.State, msg.Status);
            await _db.SaveChangesAsync(ct);
            return;
        }

        content.AutoRejectReason = BuildGuardRejectReason(msg.Status, msg.Reasons);
        content.TransitionTo(ContentState.AutoRejected);
        await _db.SaveChangesAsync(ct);

        _logger.LogWarning(
            "Guard reddi uygulandı: ContentId={ContentId} Status={Status} Reasons={Reasons}",
            msg.ContentId, msg.Status, string.Join("; ", msg.Reasons));
    }

    /// <summary>Guard durum kodunu + gerekçeleri panelde gösterilecek Türkçe özete çevirir.</summary>
    private static string BuildGuardRejectReason(string status, IReadOnlyList<string> reasons)
    {
        var baseMsg = status?.ToLowerInvariant() switch
        {
            "clamav_infected" or "eset_infected" => "Güvenlik taraması: zararlı yazılım/virüs tespit edildi",
            "policy_rejected" => "Güvenlik taraması: içerik politikası ihlali",
            "admin_rejected" => "Güvenlik taraması: yönetici tarafından reddedildi",
            "error" => "Güvenlik taraması: tarama sırasında hata oluştu",
            _ => "Güvenlik taraması: içerik reddedildi",
        };
        var detail = reasons?.Where(r => !string.IsNullOrWhiteSpace(r)).ToArray() ?? Array.Empty<string>();
        return detail.Length == 0 ? baseMsg : $"{baseMsg} ({string.Join("; ", detail)})";
    }

    private async Task ReleaseToAiModerationAsync(Domain.Content content, ContentVersion version, CancellationToken ct)
    {
        if (!content.CanTransitionTo(ContentState.Submitted))
        {
            _logger.LogWarning(
                "Guard temiz ama Submitted geçişi yapılamadı: ContentId={ContentId} State={State}",
                content.Id, content.State);
            await _db.SaveChangesAsync(ct);
            return;
        }

        content.TransitionTo(ContentState.Submitted);
        await _outbox.WriteAsync(ContentSubmittedEventFactory.Create(content, version), ct: ct);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Guard temiz — AI moderasyonu tetikleniyor: ContentId={ContentId} VersionId={VersionId}",
            content.Id, version.Id);
    }
}
