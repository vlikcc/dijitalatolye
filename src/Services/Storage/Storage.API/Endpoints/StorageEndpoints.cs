using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.Storage.API.Antivirus;
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
                "content" => "dijitalatolye-content",
                "avatar" => "dijitalatolye-avatars",
                _ => "dijitalatolye-content",
            };
            var key = $"{current.UserId:N}/{Guid.NewGuid():N}/{Sanitize(body.FileName)}";
            var url = await objectStorage.CreatePresignedUploadUrlAsync(bucket, key, TimeSpan.FromMinutes(15), body.ContentType, ct);
            return Results.Json(new PresignedUploadResponse(url, bucket, key, DateTime.UtcNow.AddMinutes(15)));
        });

        storage.MapPost("/scan", async (
            [FromBody] ScanRequest body,
            IObjectStorage objectStorage,
            IAntivirusScanner scanner,
            CancellationToken ct) =>
        {
            await using var stream = await objectStorage.GetAsync(body.Bucket, body.Key, ct);
            var result = await scanner.ScanAsync(stream, ct);
            return Results.Json(result);
        }).RequireAuthorization(Policies.EditorOrAbove);

        storage.MapGet("/download-url", async (
            [FromQuery] string bucket,
            [FromQuery] string key,
            IObjectStorage objectStorage,
            CancellationToken ct) =>
        {
            if (!await objectStorage.ObjectExistsAsync(bucket, key, ct))
            {
                return Results.NotFound();
            }
            var url = await objectStorage.CreatePresignedDownloadUrlAsync(bucket, key, TimeSpan.FromMinutes(10), ct);
            return Results.Json(new { url });
        });

        return routes;
    }

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
            // Birleştirme imleri (combining marks) ve diğer non-ASCII'leri at.
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
public sealed record ScanRequest(string Bucket, string Key);
