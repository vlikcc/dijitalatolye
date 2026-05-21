using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Storage;
using DijitalAtolye.Content.API.Persistence;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Content.API.Consumers;

/// <summary>
/// Guard admin onayı sonrası teslim edilen dosyanın hash/konum bilgisini versiyona yazar.
/// </summary>
public sealed class GuardFileDeliveredConsumer : IConsumer<GuardFileDeliveredV1>
{
    private readonly ContentDbContext _db;
    private readonly ILogger<GuardFileDeliveredConsumer> _logger;

    public GuardFileDeliveredConsumer(ContentDbContext db, ILogger<GuardFileDeliveredConsumer> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<GuardFileDeliveredV1> context)
    {
        var msg = context.Message;
        var version = await _db.Versions.FirstOrDefaultAsync(
            v => v.Id == msg.VersionId && v.ContentId == msg.ContentId,
            context.CancellationToken);

        if (version is null)
        {
            _logger.LogWarning(
                "GuardFileDeliveredV1 için versiyon bulunamadı: ContentId={ContentId} VersionId={VersionId}",
                msg.ContentId, msg.VersionId);
            return;
        }

        version.Sha256 = msg.Sha256;
        version.FileSizeBytes = msg.SizeBytes;
        await _db.SaveChangesAsync(context.CancellationToken);

        _logger.LogInformation(
            "Guard dosya teslimi kaydedildi: ContentId={ContentId} VersionId={VersionId} Sha256={Sha256}",
            msg.ContentId, msg.VersionId, msg.Sha256);
    }
}
