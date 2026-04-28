using System.IO.Compression;
using Minio;
using Minio.DataModel.Args;

namespace DijitalAtolye.Content.API.Bundles;

/// <summary>
/// Approved içeriği `published` bucket'ına açar. ZIP ise tüm dosyaları tek tek yükler;
/// tek HTML ise olduğu gibi `index.html` olarak kopyalar. Browser iframe asset'leri
/// göreceli yollarla yükleyebilsin diye bucket public-read olarak ayarlanır.
/// </summary>
public sealed class BundleExtractor
{
    private static readonly Dictionary<string, string> ContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        [".html"] = "text/html; charset=utf-8",
        [".htm"] = "text/html; charset=utf-8",
        [".css"] = "text/css; charset=utf-8",
        [".js"] = "application/javascript; charset=utf-8",
        [".mjs"] = "application/javascript; charset=utf-8",
        [".map"] = "application/json",
        [".json"] = "application/json",
        [".xml"] = "application/xml",
        [".png"] = "image/png",
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".gif"] = "image/gif",
        [".svg"] = "image/svg+xml",
        [".webp"] = "image/webp",
        [".ico"] = "image/x-icon",
        [".mp3"] = "audio/mpeg",
        [".mp4"] = "video/mp4",
        [".webm"] = "video/webm",
        [".ogg"] = "audio/ogg",
        [".wav"] = "audio/wav",
        [".woff"] = "font/woff",
        [".woff2"] = "font/woff2",
        [".ttf"] = "font/ttf",
        [".eot"] = "application/vnd.ms-fontobject",
        [".txt"] = "text/plain; charset=utf-8",
        [".md"] = "text/markdown; charset=utf-8",
    };

    private readonly IMinioClient _minio;
    private readonly ILogger<BundleExtractor> _logger;

    public BundleExtractor(IMinioClient minio, ILogger<BundleExtractor> logger)
    {
        _minio = minio;
        _logger = logger;
    }

    public async Task<ExtractResult> ExtractToPublishedAsync(
        string sourceBucket,
        string sourceKey,
        string manifestEntry,
        string publishedBucket,
        string publishedPrefix,
        CancellationToken ct)
    {
        await EnsurePublicBucketAsync(publishedBucket, ct);

        await using var ms = new MemoryStream();
        await _minio.GetObjectAsync(new GetObjectArgs()
            .WithBucket(sourceBucket)
            .WithObject(sourceKey)
            .WithCallbackStream(s => s.CopyTo(ms)), ct);
        ms.Position = 0;

        var ext = Path.GetExtension(sourceKey).ToLowerInvariant();
        if (ext is ".html" or ".htm")
        {
            // Tek dosya: doğrudan index.html olarak yerleştir.
            var key = $"{publishedPrefix}/index.html";
            await UploadAsync(publishedBucket, key, ms.ToArray(), GetContentType(".html"), ct);
            return new ExtractResult(key, 1);
        }
        if (ext != ".zip")
        {
            throw new InvalidOperationException($"Desteklenmeyen bundle uzantısı: {ext}");
        }

        ms.Position = 0;
        using var zip = new ZipArchive(ms, ZipArchiveMode.Read, leaveOpen: true);
        var fileCount = 0;
        var entryNorm = manifestEntry.Replace('\\', '/').TrimStart('/');
        foreach (var entry in zip.Entries)
        {
            if (string.IsNullOrEmpty(entry.Name)) continue; // klasör girdileri atla
            var rel = entry.FullName.Replace('\\', '/').TrimStart('/');
            if (rel.Contains("..", StringComparison.Ordinal)) continue; // zip-slip koruması (validator zaten reddetti ama yine de)

            using var entryStream = entry.Open();
            using var buf = new MemoryStream();
            await entryStream.CopyToAsync(buf, ct);
            var bytes = buf.ToArray();

            var key = $"{publishedPrefix}/{rel}";
            var ct2 = GetContentType(Path.GetExtension(rel));
            await UploadAsync(publishedBucket, key, bytes, ct2, ct);
            fileCount++;
        }

        var entryKey = $"{publishedPrefix}/{entryNorm}";
        return new ExtractResult(entryKey, fileCount);
    }

    private async Task UploadAsync(string bucket, string key, byte[] data, string contentType, CancellationToken ct)
    {
        using var stream = new MemoryStream(data);
        await _minio.PutObjectAsync(new PutObjectArgs()
            .WithBucket(bucket)
            .WithObject(key)
            .WithStreamData(stream)
            .WithObjectSize(data.Length)
            .WithContentType(contentType), ct);
    }

    private async Task EnsurePublicBucketAsync(string bucket, CancellationToken ct)
    {
        var exists = await _minio.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucket), ct);
        if (!exists)
        {
            await _minio.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucket), ct);
        }
        // Idempotent set — her seferinde aynı policy'yi kuruyor (public read GetObject).
        var policy = "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":[\"*\"]},\"Action\":[\"s3:GetObject\"],\"Resource\":[\"arn:aws:s3:::" + bucket + "/*\"]}]}";
        try
        {
            await _minio.SetPolicyAsync(new SetPolicyArgs().WithBucket(bucket).WithPolicy(policy), ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Bucket policy set başarısız: {Bucket}", bucket);
        }
    }

    private static string GetContentType(string ext) =>
        ContentTypes.TryGetValue(ext, out var v) ? v : "application/octet-stream";
}

public sealed record ExtractResult(string EntryKey, int FileCount);
