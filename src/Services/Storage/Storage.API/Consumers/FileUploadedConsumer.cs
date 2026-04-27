using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Storage;
using DijitalAtolye.Storage.API.Antivirus;
using DijitalAtolye.Storage.API.Storage;
using MassTransit;

namespace DijitalAtolye.Storage.API.Consumers;

public sealed class FileUploadedConsumer : IConsumer<FileUploadedV1>
{
    private readonly IObjectStorage _storage;
    private readonly IAntivirusScanner _scanner;
    private readonly ILogger<FileUploadedConsumer> _logger;

    public FileUploadedConsumer(IObjectStorage storage, IAntivirusScanner scanner, ILogger<FileUploadedConsumer> logger)
    {
        _storage = storage;
        _scanner = scanner;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<FileUploadedV1> context)
    {
        var msg = context.Message;
        _logger.LogInformation("FileUploadedV1 alındı: ContentId={ContentId}, Bucket={Bucket}, Key={Key}", 
            msg.ContentId, msg.Bucket, msg.Key);

        try
        {
            await using var stream = await _storage.GetAsync(msg.Bucket, msg.Key, context.CancellationToken);
            var result = await _scanner.ScanAsync(stream, context.CancellationToken);

            if (!result.IsClean)
            {
                _logger.LogWarning("Virüs tespit edildi! ContentId={ContentId}, VirusName={VirusName}", 
                    msg.ContentId, result.VirusName);

                await context.Publish(new VirusDetectedV1
                {
                    ContentId = msg.ContentId,
                    VersionId = msg.VersionId,
                    VirusName = result.VirusName
                }, context.CancellationToken);
            }
            else
            {
                _logger.LogInformation("Dosya temiz. ContentId={ContentId}", msg.ContentId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Antivirüs taraması sırasında hata oluştu. ContentId={ContentId}", msg.ContentId);
            // Karar: Tarama başarısız olursa dosyayı şüpheli işaretleyebiliriz veya tekrar denemesi için fırlatabiliriz.
            throw;
        }
    }
}
