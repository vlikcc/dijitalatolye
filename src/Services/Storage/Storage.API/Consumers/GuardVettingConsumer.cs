using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Storage;
using DijitalAtolye.Storage.API.Guard;
using DijitalAtolye.Storage.API.Storage;
using MassTransit;

namespace DijitalAtolye.Storage.API.Consumers;

/// <summary>
/// MinIO'ya yüklenen dosyayı okuyup Guard'a tarama için iletir.
/// ClamAV yerine Guard pipeline'ının giriş noktasıdır.
/// </summary>
public sealed class GuardVettingConsumer : IConsumer<FileUploadedV1>
{
    private readonly IObjectStorage _storage;
    private readonly IFileVettingService _vetting;
    private readonly ILogger<GuardVettingConsumer> _logger;

    public GuardVettingConsumer(
        IObjectStorage storage,
        IFileVettingService vetting,
        ILogger<GuardVettingConsumer> logger)
    {
        _storage = storage;
        _vetting = vetting;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<FileUploadedV1> context)
    {
        var msg = context.Message;
        _logger.LogInformation(
            "FileUploadedV1 → Guard: ContentId={ContentId}, VersionId={VersionId}, Bucket={Bucket}, Key={Key}",
            msg.ContentId, msg.VersionId, msg.Bucket, msg.Key);

        await using var stream = await _storage.GetAsync(msg.Bucket, msg.Key, context.CancellationToken);
        var fileName = Path.GetFileName(msg.Key);
        if (string.IsNullOrWhiteSpace(fileName))
        {
            fileName = "upload.bin";
        }

        var response = await _vetting.SubmitAsync(new VettingSubmission(
            stream,
            fileName,
            msg.ContentId,
            msg.VersionId,
            msg.Bucket,
            msg.Key), context.CancellationToken);

        _logger.LogInformation(
            "Guard vetting kabul edildi: GuardFileId={GuardFileId} Status={Status} ContentId={ContentId}",
            response.Id, response.Status, msg.ContentId);
    }
}
