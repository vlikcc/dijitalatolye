using System.Net.Http.Json;
using System.Text.Json.Serialization;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Storage;
using MassTransit;

namespace DijitalAtolye.Storage.API.Guard;

/// <summary>
/// Guard imajı tarama sonrası otomatik scan-callback göndermiyor; durumu poll edip
/// <see cref="GuardScanUpdatedV1"/> yayınlar.
/// </summary>
public interface IGuardScanStatusSync
{
    void ScheduleSync(Guid contentId, Guid versionId, string guardFileId);
}

public sealed class GuardScanStatusSync : IGuardScanStatusSync
{
    private static readonly HashSet<string> PendingStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "pending_scan",
        "scanning",
        "delivering",
    };

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<GuardScanStatusSync> _logger;

    public GuardScanStatusSync(IServiceScopeFactory scopeFactory, ILogger<GuardScanStatusSync> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public void ScheduleSync(Guid contentId, Guid versionId, string guardFileId)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                await PollAndPublishAsync(contentId, versionId, guardFileId, CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Guard scan sync başarısız: ContentId={ContentId} GuardFileId={GuardFileId}",
                    contentId, guardFileId);
            }
        });
    }

    private async Task PollAndPublishAsync(
        Guid contentId,
        Guid versionId,
        string guardFileId,
        CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var httpFactory = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>();
        var options = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Options.IOptions<GuardOptions>>().Value;
        var publisher = scope.ServiceProvider.GetRequiredService<IPublishEndpoint>();

        using var http = httpFactory.CreateClient(nameof(GuardScanStatusSync));
        http.BaseAddress = new Uri(options.BaseUrl.TrimEnd('/') + "/");

        for (var attempt = 0; attempt < 30; attempt++)
        {
            await Task.Delay(TimeSpan.FromSeconds(2), ct);

            var status = await http.GetFromJsonAsync<GuardFileStatusResponse>(
                $"/api/v1/uploads/{guardFileId}/status/", ct);
            if (status is null || string.IsNullOrWhiteSpace(status.Status))
            {
                continue;
            }

            if (PendingStatuses.Contains(status.Status))
            {
                continue;
            }

            if (!GuardSourceContentId.TryDecode(status.SourceContentId, out var decodedContentId, out var decodedVersionId, out _, out _))
            {
                decodedContentId = contentId;
                decodedVersionId = versionId;
            }

            await publisher.Publish(new GuardScanUpdatedV1
            {
                ContentId = decodedContentId,
                VersionId = decodedVersionId,
                GuardFileId = guardFileId,
                Status = status.Status,
                ScannedAtUtc = status.UpdatedAtUtc?.UtcDateTime ?? DateTime.UtcNow,
            }, ct);

            _logger.LogInformation(
                "Guard scan sync yayınlandı: ContentId={ContentId} Status={Status} GuardFileId={GuardFileId}",
                decodedContentId, status.Status, guardFileId);
            return;
        }

        _logger.LogWarning(
            "Guard scan sync zaman aşımı: ContentId={ContentId} GuardFileId={GuardFileId}",
            contentId, guardFileId);
    }

    private sealed record GuardFileStatusResponse(
        [property: JsonPropertyName("source_content_id")] string SourceContentId,
        [property: JsonPropertyName("status")] string Status,
        [property: JsonPropertyName("updated_at")] DateTimeOffset? UpdatedAtUtc);
}
