using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.Storage.API.Guard;
using DijitalAtolye.Storage.API.Storage;
using Microsoft.AspNetCore.Mvc;

namespace DijitalAtolye.Storage.API.Endpoints;

public static class StorageEndpoints
{
    public static IEndpointRouteBuilder MapStorageEndpoints(this IEndpointRouteBuilder routes)
    {
        var storage = routes.MapGroup("/storage").WithTags("Storage").RequireAuthorization();

        storage.MapPost("/uploads/presigned", async (
            [FromBody] PresignedUploadRequest body,
            ICurrentUser current,
            IObjectStorage objectStorage,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var bucket = body.Purpose switch
            {
                "content" => ContentBucket,
                "avatar" => AvatarBucket,
                _ => null,
            };
            if (bucket is null)
            {
                return Results.BadRequest(new { error = "Geçersiz purpose." });
            }
            var key = $"{current.UserId:N}/{Guid.NewGuid():N}/{Sanitize(body.FileName)}";
            var url = await objectStorage.CreatePresignedUploadUrlAsync(bucket, key, TimeSpan.FromMinutes(15), body.ContentType, ct);
            return Results.Json(new PresignedUploadResponse(url, bucket, key, DateTime.UtcNow.AddMinutes(15)));
        });

        storage.MapPost("/guard/upload", async (
            IFormFile file,
            [FromForm] Guid contentId,
            [FromForm] Guid versionId,
            [FromForm] string bucket,
            [FromForm] string key,
            ICurrentUser current,
            IFileVettingService vetting,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            if (file is null || file.Length == 0)
            {
                return Results.BadRequest(new { error = "Dosya boş veya eksik." });
            }
            if (string.IsNullOrWhiteSpace(bucket) || string.IsNullOrWhiteSpace(key))
            {
                return Results.BadRequest(new { error = "bucket ve key zorunlu." });
            }
            if (!AllowedBuckets.Contains(bucket) || !IsSafeKey(key))
            {
                return Results.BadRequest(new { error = "Geçersiz bucket veya key." });
            }

            await using var stream = file.OpenReadStream();
            var response = await vetting.SubmitAsync(new VettingSubmission(
                stream,
                file.FileName,
                contentId,
                versionId,
                bucket,
                key,
                current.UserId.Value.ToString("N")), ct);

            return Results.Json(new GuardUploadEndpointResponse(
                response.Id,
                response.Status,
                response.Sha256,
                response.FileSize));
        })
        // Normal akış event tabanlıdır (GuardVettingConsumer); bu uç yalnızca operasyonel yeniden gönderim içindir.
        .RequireAuthorization(Policies.AdminOnly)
        .DisableAntiforgery();

        storage.MapGet("/download-url", async (
            [FromQuery] string bucket,
            [FromQuery] string key,
            IObjectStorage objectStorage,
            CancellationToken ct) =>
        {
            if (!AllowedBuckets.Contains(bucket) || !IsSafeKey(key))
            {
                return Results.BadRequest(new { error = "Geçersiz bucket veya key." });
            }
            if (!await objectStorage.ObjectExistsAsync(bucket, key, ct))
            {
                return Results.NotFound();
            }
            var url = await objectStorage.CreatePresignedDownloadUrlAsync(bucket, key, TimeSpan.FromMinutes(10), ct);
            return Results.Json(new { url });
        })
        // bucket/key istemciden geldiği için sahiplik doğrulanamaz; yalnızca admin. Oynatma/kapak akışları Content.API üzerinden gider.
        .RequireAuthorization(Policies.AdminOnly);

        return routes;
    }

    private const string ContentBucket = "dijitalatolye-content";
    private const string AvatarBucket = "dijitalatolye-avatars";
    private const string PublishedBucket = "dijitalatolye-content-published";

    private static readonly HashSet<string> AllowedBuckets = new(StringComparer.Ordinal)
    {
        ContentBucket, AvatarBucket, PublishedBucket,
    };

    private static bool IsSafeKey(string key) =>
        key.Length <= 1024 && !key.StartsWith('/') && !key.Contains("..", StringComparison.Ordinal) && !key.Contains('\\');

    private static readonly Dictionary<char, string> TurkishMap = new()
    {
        ['ı'] = "i", ['İ'] = "I",
        ['ş'] = "s", ['Ş'] = "S",
        ['ğ'] = "g", ['Ğ'] = "G",
        ['ü'] = "u", ['Ü'] = "U",
        ['ö'] = "o", ['Ö'] = "O",
        ['ç'] = "c", ['Ç'] = "C",
    };

    /// <summary>
    /// Object key olarak kullanılacak şekilde dosya adını ASCII'ye çevirir.
    /// Türkçe karakter NFD/NFC ayrımı (ör. macOS'ta <c>ü</c> = <c>u + U+0308</c>) S3 presigned imzalarında
    /// host-vs-key encoding ile uyumsuzluk yaratabildiği için tüm non-ASCII karakterler temizlenir.
    /// </summary>
    private static string Sanitize(string? fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName)) return "file";

        var normalized = fileName.Normalize(System.Text.NormalizationForm.FormC);
        var invalid = Path.GetInvalidFileNameChars();
        var sb = new System.Text.StringBuilder(normalized.Length);
        foreach (var ch in normalized)
        {
            if (invalid.Contains(ch) || ch == '/' || ch == '\\')
            {
                continue;
            }
            if (TurkishMap.TryGetValue(ch, out var mapped))
            {
                sb.Append(mapped);
                continue;
            }
            if (ch <= 0x7F)
            {
                sb.Append(ch);
                continue;
            }
            if (System.Globalization.CharUnicodeInfo.GetUnicodeCategory(ch) is
                System.Globalization.UnicodeCategory.NonSpacingMark or
                System.Globalization.UnicodeCategory.SpacingCombiningMark or
                System.Globalization.UnicodeCategory.EnclosingMark)
            {
                continue;
            }
            sb.Append('_');
        }

        var clean = sb.ToString().Trim('.', ' ', '_');
        return clean.Length == 0 ? "file" : clean;
    }
}

public sealed record PresignedUploadRequest(string FileName, string ContentType, string Purpose);
public sealed record PresignedUploadResponse(string Url, string Bucket, string Key, DateTime ExpiresAtUtc);
public sealed record GuardUploadEndpointResponse(string GuardFileId, string Status, string Sha256, long FileSize);
