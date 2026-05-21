using System.Text.Json;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Storage;
using DijitalAtolye.Storage.API.Guard;
using DijitalAtolye.Storage.API.Storage;
using MassTransit;
using Microsoft.Extensions.Options;

namespace DijitalAtolye.Storage.API.Endpoints;

/// <summary>
/// Guard'ın ana siteye yazdığı iki uç noktayı host eder:
///   - <c>POST /api/internal/scan-callback/</c>  (tarama durum bildirimi)
///   - <c>POST /api/internal/approved-files/</c> (admin onaylı dosya teslimi)
/// İkisi de HMAC-SHA256 ile doğrulanır; başarılı doğrulama sonrası integration event yayınlanır.
/// Bu uç noktalar JWT auth'a tabi DEĞİL; kimlik kanıtı imzanın kendisidir.
/// </summary>
public static class GuardCallbackEndpoints
{
    public static IEndpointRouteBuilder MapGuardCallbackEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/internal").WithTags("Guard");

        group.MapPost("/scan-callback", HandleScanCallback);
        group.MapPost("/scan-callback/", HandleScanCallback);
        group.MapPost("/approved-files", HandleApprovedFile).DisableAntiforgery();
        group.MapPost("/approved-files/", HandleApprovedFile).DisableAntiforgery();

        return routes;
    }

    private static async Task<IResult> HandleScanCallback(
        HttpRequest request,
        IPublishEndpoint publisher,
        GuardSignatureService signer,
        IOptions<GuardOptions> options,
        ILogger<GuardSignatureService> logger,
        CancellationToken ct)
    {
        var opts = options.Value;

        request.EnableBuffering();
        using var ms = new MemoryStream();
        await request.Body.CopyToAsync(ms, ct);
        var rawBody = ms.ToArray();

        if (!TryVerifyJsonHmac(request, signer, opts, rawBody, out var verifyError))
        {
            logger.LogWarning("Guard scan-callback HMAC reddedildi: {Reason}", verifyError);
            return Results.Unauthorized();
        }

        var payload = JsonSerializer.Deserialize<GuardScanCallbackBody>(rawBody);
        if (payload is null)
        {
            return Results.BadRequest(new { error = "Body parse edilemedi." });
        }

        if (!GuardSourceContentId.TryDecode(payload.SourceContentId, out var contentId, out var versionId, out _, out _))
        {
            logger.LogWarning("Guard scan-callback geçersiz source_content_id: {Raw}", payload.SourceContentId);
            return Results.BadRequest(new { error = "source_content_id ana sitenin formatına uymuyor." });
        }

        await publisher.Publish(new GuardScanUpdatedV1
        {
            ContentId = contentId,
            VersionId = versionId,
            GuardFileId = payload.GuardFileId,
            Status = payload.Status,
            Reasons = payload.Reasons ?? Array.Empty<string>(),
            ScannedAtUtc = payload.ScannedAt?.UtcDateTime ?? DateTime.UtcNow,
        }, ct);

        return Results.Ok(new { received = true });
    }

    private static async Task<IResult> HandleApprovedFile(
        HttpRequest request,
        IPublishEndpoint publisher,
        IObjectStorage storage,
        GuardSignatureService signer,
        IOptions<GuardOptions> options,
        ILogger<GuardSignatureService> logger,
        CancellationToken ct)
    {
        var opts = options.Value;

        if (!TryVerifyDeliveryHmac(request, signer, opts, out var verifyError))
        {
            logger.LogWarning("Guard approved-files HMAC reddedildi: {Reason}", verifyError);
            return Results.Unauthorized();
        }

        if (!request.HasFormContentType)
        {
            return Results.BadRequest(new { error = "multipart/form-data bekleniyor." });
        }

        var form = await request.ReadFormAsync(ct);
        var metadataJson = form["metadata"].FirstOrDefault();
        var file = form.Files["file"];
        if (string.IsNullOrWhiteSpace(metadataJson) || file is null)
        {
            return Results.BadRequest(new { error = "metadata + file alanları zorunlu." });
        }

        var metadata = JsonSerializer.Deserialize<GuardApprovedFileMetadata>(metadataJson);
        if (metadata is null)
        {
            return Results.BadRequest(new { error = "metadata JSON parse edilemedi." });
        }

        if (!GuardSourceContentId.TryDecode(metadata.SourceContentId, out var contentId, out var versionId, out var bucket, out var key))
        {
            return Results.BadRequest(new { error = "source_content_id formatı geçersiz." });
        }

        if (string.IsNullOrWhiteSpace(bucket) || string.IsNullOrWhiteSpace(key))
        {
            return Results.BadRequest(new { error = "source_content_id MinIO konumu içermiyor." });
        }

        await using var fileStream = file.OpenReadStream();
        var actualSha = await signer.ComputeBodySha256HexAsync(fileStream, ct);
        if (!string.Equals(actualSha, metadata.Sha256, StringComparison.OrdinalIgnoreCase))
        {
            logger.LogError("Guard approved-files SHA256 uyuşmazlığı: gelen={Got} beklenen={Expected}",
                actualSha, metadata.Sha256);
            return Results.BadRequest(new { error = "SHA256 metadata ile uyuşmuyor." });
        }

        await using var putStream = file.OpenReadStream();
        var contentType = metadata.Mime ?? file.ContentType ?? "application/octet-stream";
        await storage.PutAsync(bucket, key, putStream, contentType, ct);

        await publisher.Publish(new GuardFileDeliveredV1
        {
            ContentId = contentId,
            VersionId = versionId,
            GuardFileId = metadata.GuardFileId,
            Sha256 = metadata.Sha256,
            SizeBytes = metadata.Size,
            Extension = metadata.Extension,
            MimeType = metadata.Mime,
            StorageBucket = bucket,
            StorageKey = key,
        }, ct);

        logger.LogInformation(
            "Guard dosya teslimi MinIO'ya yazıldı: ContentId={ContentId} Bucket={Bucket} Key={Key}",
            contentId, bucket, key);

        return Results.Ok(new { received = true });
    }

    private static bool TryVerifyJsonHmac(
        HttpRequest request,
        GuardSignatureService signer,
        GuardOptions opts,
        byte[] rawBody,
        out string error)
    {
        var bodyHash = signer.ComputeBodySha256Hex(rawBody);
        return TryVerifyHmacCore(request, signer, opts, bodyHash, out error);
    }

    private static bool TryVerifyDeliveryHmac(
        HttpRequest request,
        GuardSignatureService signer,
        GuardOptions opts,
        out string error)
    {
        error = string.Empty;
        var compositeSha = request.Headers["X-Guard-Body-SHA"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(compositeSha))
        {
            error = "X-Guard-Body-SHA header eksik.";
            return false;
        }

        var bodyHash = signer.ComputeDeliverySignedBodyHash(compositeSha);
        return TryVerifyHmacCore(request, signer, opts, bodyHash, out error);
    }

    private static bool TryVerifyHmacCore(
        HttpRequest request,
        GuardSignatureService signer,
        GuardOptions opts,
        string bodyHashHex,
        out string error)
    {
        error = string.Empty;
        var secret = opts.EffectiveInboundSecret;

        if (string.IsNullOrWhiteSpace(secret))
        {
            error = "Guard inbound HMAC secret yapılandırılmamış.";
            return false;
        }

        var timestamp = request.Headers["X-Guard-Timestamp"].FirstOrDefault();
        var nonce = request.Headers["X-Guard-Nonce"].FirstOrDefault();
        var signature = request.Headers["X-Guard-Signature"].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(timestamp) || string.IsNullOrWhiteSpace(nonce) || string.IsNullOrWhiteSpace(signature))
        {
            error = "Eksik HMAC header.";
            return false;
        }

        if (!signer.IsTimestampFresh(timestamp, opts.TimestampSkewSeconds))
        {
            error = "Timestamp skew aşıldı.";
            return false;
        }

        var path = request.Path.Value ?? request.Path.ToString();
        if (!path.EndsWith('/'))
        {
            path += "/";
        }

        if (!signer.Verify(secret, request.Method, path, timestamp, nonce, bodyHashHex, signature))
        {
            error = "İmza eşleşmedi.";
            return false;
        }

        return true;
    }
}
