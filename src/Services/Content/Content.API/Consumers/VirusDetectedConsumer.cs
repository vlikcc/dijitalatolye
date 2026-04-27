using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Storage;
using DijitalAtolye.Content.API.Domain;
using DijitalAtolye.Content.API.Persistence;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Content.API.Consumers;

public sealed class VirusDetectedConsumer : IConsumer<VirusDetectedV1>
{
    private readonly ContentDbContext _db;
    private readonly ILogger<VirusDetectedConsumer> _logger;

    public VirusDetectedConsumer(ContentDbContext db, ILogger<VirusDetectedConsumer> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<VirusDetectedV1> context)
    {
        var msg = context.Message;
        _logger.LogWarning("Virüs tespit edildi! ContentId: {ContentId}, VersionId: {VersionId}, Virüs: {VirusName}", 
            msg.ContentId, msg.VersionId, msg.VirusName);

        var content = await _db.Contents.FirstOrDefaultAsync(c => c.Id == msg.ContentId, context.CancellationToken);
        if (content is null)
        {
            _logger.LogWarning("Virüs tespit edilen içerik bulunamadı. ContentId: {ContentId}", msg.ContentId);
            return;
        }

        // Eğer içerik henüz gönderilmemişse veya AI incelemesindeyse doğrudan reddediyoruz.
        content.TransitionTo(ContentState.AutoRejected);
        
        // Opsiyonel: Versiyon durumuna not düşülebilir ancak V1'de State'i değiştirmek yeterli.
        await _db.SaveChangesAsync(context.CancellationToken);
    }
}
