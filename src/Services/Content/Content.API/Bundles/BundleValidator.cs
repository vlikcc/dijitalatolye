using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;
using Minio;
using Minio.DataModel.Args;

namespace DijitalAtolye.Content.API.Bundles;

/// <summary>
/// Yüklenen bundle'ın (tek HTML veya ZIP) bytelarını indirir, izinli dosya türleri + manifest.json validasyonu yapar.
/// PRD §6.2 uyarınca: maks. 50 MB, dosya türü whitelist, manifest zorunlu (entry, title, version).
/// </summary>
public sealed class BundleValidator
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".html", ".htm", ".css", ".js", ".mjs", ".map",
        ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico",
        ".json", ".xml",
        ".mp3", ".mp4", ".webm", ".ogg", ".wav",
        ".woff", ".woff2", ".ttf", ".eot",
        ".txt", ".md",
    };

    private const long MaxBundleBytes = 50L * 1024 * 1024;
    private const string ManifestFileName = "manifest.json";

    private readonly IMinioClient _minio;

    public BundleValidator(IMinioClient minio)
    {
        _minio = minio;
    }

    public async Task<BundleValidationResult> ValidateAsync(string bucket, string key, string? declaredManifestEntry, CancellationToken ct)
    {
        await using var ms = new MemoryStream();
        await _minio.GetObjectAsync(new GetObjectArgs()
            .WithBucket(bucket)
            .WithObject(key)
            .WithCallbackStream(s => s.CopyTo(ms)), ct);
        ms.Position = 0;
        if (ms.Length == 0) throw new BundleValidationException("Boş dosya yüklendi.");
        if (ms.Length > MaxBundleBytes) throw new BundleValidationException($"Dosya boyutu {MaxBundleBytes / 1024 / 1024} MB sınırını aşıyor.");

        var sha = Convert.ToHexString(SHA256.HashData(ms.ToArray())).ToLowerInvariant();
        ms.Position = 0;

        var ext = Path.GetExtension(key).ToLowerInvariant();
        if (ext == ".zip")
        {
            return ValidateZip(ms, declaredManifestEntry, sha, ms.Length);
        }
        if (ext is ".html" or ".htm")
        {
            return new BundleValidationResult(
                Sha256: sha,
                SizeBytes: ms.Length,
                ManifestEntry: Path.GetFileName(key),
                ManifestJson: null,
                ManifestTitle: null,
                ManifestVersion: null,
                ManifestAuthor: null,
                FileCount: 1);
        }
        throw new BundleValidationException("Sadece tek HTML dosyası veya .zip arşivi yüklenebilir.");
    }

    private static BundleValidationResult ValidateZip(Stream zipStream, string? declaredEntry, string sha, long size)
    {
        zipStream.Position = 0;
        using var archive = new ZipArchive(zipStream, ZipArchiveMode.Read, leaveOpen: true);

        if (archive.Entries.Count == 0) throw new BundleValidationException("ZIP arşivi boş.");
        if (archive.Entries.Count > 500) throw new BundleValidationException("ZIP arşivi 500'den fazla dosya içeremez.");

        var fileCount = 0;
        ZipArchiveEntry? manifestEntry = null;
        foreach (var entry in archive.Entries)
        {
            if (string.IsNullOrEmpty(entry.Name)) continue; // klasör girdileri
            if (IsOsMetadataEntry(entry.FullName, entry.Name)) continue; // macOS __MACOSX/._*, .DS_Store, Thumbs.db vb.
            if (entry.FullName.Contains("..", StringComparison.Ordinal) || entry.FullName.StartsWith('/'))
                throw new BundleValidationException($"Şüpheli yol: {entry.FullName}");
            if (entry.Length > MaxBundleBytes)
                throw new BundleValidationException($"İçerideki dosya boyutu sınır aşıyor: {entry.FullName}");

            var ext = Path.GetExtension(entry.Name).ToLowerInvariant();
            if (!AllowedExtensions.Contains(ext))
                throw new BundleValidationException($"İzin verilmeyen dosya türü: {entry.FullName}");

            if (string.Equals(entry.Name, ManifestFileName, StringComparison.OrdinalIgnoreCase) && manifestEntry is null)
                manifestEntry = entry;
            fileCount++;
        }

        if (manifestEntry is null)
            throw new BundleValidationException("manifest.json zorunludur ve kök dizinde olmalıdır.");

        string manifestJson;
        using (var reader = new StreamReader(manifestEntry.Open()))
        {
            manifestJson = reader.ReadToEnd();
        }

        ManifestDto manifest;
        try
        {
            manifest = JsonSerializer.Deserialize<ManifestDto>(manifestJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                ?? throw new BundleValidationException("manifest.json parse edilemedi.");
        }
        catch (JsonException ex)
        {
            throw new BundleValidationException($"manifest.json geçersiz JSON: {ex.Message}");
        }

        if (string.IsNullOrWhiteSpace(manifest.Entry))
            throw new BundleValidationException("manifest.entry zorunludur.");
        if (string.IsNullOrWhiteSpace(manifest.Title))
            throw new BundleValidationException("manifest.title zorunludur.");
        if (string.IsNullOrWhiteSpace(manifest.Version))
            throw new BundleValidationException("manifest.version zorunludur.");

        var entryPath = manifest.Entry.Replace('\\', '/').TrimStart('/');
        var entryExists = archive.Entries.Any(e => string.Equals(e.FullName.Replace('\\', '/'), entryPath, StringComparison.OrdinalIgnoreCase));
        if (!entryExists) throw new BundleValidationException($"manifest.entry dosyası ZIP içinde bulunamadı: {entryPath}");

        if (!string.IsNullOrWhiteSpace(declaredEntry) && !string.Equals(declaredEntry, entryPath, StringComparison.OrdinalIgnoreCase))
            throw new BundleValidationException($"Beyan edilen entry ({declaredEntry}) manifest entry ile eşleşmiyor ({entryPath}).");

        return new BundleValidationResult(
            Sha256: sha,
            SizeBytes: size,
            ManifestEntry: entryPath,
            ManifestJson: manifestJson,
            ManifestTitle: manifest.Title,
            ManifestVersion: manifest.Version,
            ManifestAuthor: manifest.Author,
            FileCount: fileCount);
    }

    private static bool IsOsMetadataEntry(string fullName, string name)
    {
        var normalized = fullName.Replace('\\', '/');
        if (normalized.StartsWith("__MACOSX/", StringComparison.Ordinal)) return true;
        if (name.StartsWith("._", StringComparison.Ordinal)) return true;
        if (string.Equals(name, ".DS_Store", StringComparison.OrdinalIgnoreCase)) return true;
        if (string.Equals(name, "Thumbs.db", StringComparison.OrdinalIgnoreCase)) return true;
        if (string.Equals(name, "desktop.ini", StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }

    private sealed record ManifestDto(string? Entry, string? Title, string? Version, string? Author, string? Description);
}

public sealed record BundleValidationResult(
    string Sha256,
    long SizeBytes,
    string ManifestEntry,
    string? ManifestJson,
    string? ManifestTitle,
    string? ManifestVersion,
    string? ManifestAuthor,
    int FileCount);

public sealed class BundleValidationException : Exception
{
    public BundleValidationException(string message) : base(message) { }
}
