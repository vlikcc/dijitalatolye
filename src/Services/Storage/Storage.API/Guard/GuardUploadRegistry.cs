using System.Collections.Concurrent;

namespace DijitalAtolye.Storage.API.Guard;

/// <summary>
/// Guard'a gönderilen <c>source_content_id</c> yalnızca content/version kimliği taşır (128 karakter sınırı).
/// Admin onaylı dosya tesliminde MinIO konumu bu kayıttan çözülür.
/// </summary>
public interface IGuardUploadRegistry
{
    void Register(Guid contentId, Guid versionId, string bucket, string key);

    bool TryGet(Guid contentId, Guid versionId, out string bucket, out string key);
}

public sealed class InMemoryGuardUploadRegistry : IGuardUploadRegistry
{
    private readonly ConcurrentDictionary<string, (string Bucket, string Key)> _entries = new();

    public void Register(Guid contentId, Guid versionId, string bucket, string key)
        => _entries[Key(contentId, versionId)] = (bucket, key);

    public bool TryGet(Guid contentId, Guid versionId, out string bucket, out string key)
    {
        if (_entries.TryGetValue(Key(contentId, versionId), out var entry))
        {
            bucket = entry.Bucket;
            key = entry.Key;
            return true;
        }

        bucket = string.Empty;
        key = string.Empty;
        return false;
    }

    private static string Key(Guid contentId, Guid versionId)
        => $"{contentId:N}|{versionId:N}";
}
