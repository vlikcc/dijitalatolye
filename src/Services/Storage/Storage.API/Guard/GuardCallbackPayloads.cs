using System.Text.Json.Serialization;

namespace DijitalAtolye.Storage.API.Guard;

/// <summary>
/// Guard'ın <c>POST /api/internal/scan-callback/</c> uç noktasına gönderdiği JSON body.
/// </summary>
public sealed record GuardScanCallbackBody(
    [property: JsonPropertyName("guard_file_id")] string GuardFileId,
    [property: JsonPropertyName("source_content_id")] string SourceContentId,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("event")] string? Event,
    [property: JsonPropertyName("verdict")] string? Verdict,
    [property: JsonPropertyName("reasons")] IReadOnlyList<string>? Reasons,
    [property: JsonPropertyName("scanned_at")] DateTimeOffset? ScannedAt,
    [property: JsonPropertyName("sha256")] string? Sha256);

/// <summary>
/// Guard'ın <c>POST /api/internal/approved-files/</c> uç noktasında multipart
/// <c>metadata</c> alanı olarak gönderdiği JSON şekli.
/// </summary>
public sealed record GuardApprovedFileMetadata(
    [property: JsonPropertyName("guard_file_id")] string GuardFileId,
    [property: JsonPropertyName("source_content_id")] string SourceContentId,
    [property: JsonPropertyName("sha256")] string Sha256,
    [property: JsonPropertyName("size")] long Size,
    [property: JsonPropertyName("extension")] string? Extension,
    [property: JsonPropertyName("mime")] string? Mime);

/// <summary>
/// Storage.API, Guard'a yolladığı her isteğin <c>source_content_id</c>'sine
/// <c>{ContentId}|{VersionId}|{Bucket}|{Key}</c> formatında kimlik + MinIO konumunu gömer.
/// Guard bu değeri opak string olarak geri yansıttığı için ana site DB sorgusu olmadan
/// callback'leri doğru içeriğe eşleyebilir.
/// </summary>
public static class GuardSourceContentId
{
    private const char Separator = '|';

    public static string Encode(Guid contentId, Guid versionId, string bucket, string key)
        => string.Join(Separator, contentId.ToString("N"), versionId.ToString("N"), bucket, key);

    public static bool TryDecode(string value, out Guid contentId, out Guid versionId, out string bucket, out string key)
    {
        contentId = Guid.Empty;
        versionId = Guid.Empty;
        bucket = string.Empty;
        key = string.Empty;
        if (string.IsNullOrWhiteSpace(value)) return false;

        var parts = value.Split(Separator, 4);
        if (parts.Length == 4)
        {
            return Guid.TryParseExact(parts[0], "N", out contentId)
                && Guid.TryParseExact(parts[1], "N", out versionId)
                && !string.IsNullOrWhiteSpace(bucket = parts[2])
                && !string.IsNullOrWhiteSpace(key = parts[3]);
        }

        // Geriye dönük: eski {ContentId}|{VersionId} formatı (MinIO konumu yok).
        if (parts.Length == 2
            && Guid.TryParseExact(parts[0], "N", out contentId)
            && Guid.TryParseExact(parts[1], "N", out versionId))
        {
            return true;
        }

        return false;
    }
}
