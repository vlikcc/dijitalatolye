namespace DijitalAtolye.Storage.API.Storage;

public interface IObjectStorage
{
    Task<string> CreatePresignedUploadUrlAsync(string bucket, string key, TimeSpan expiry, string? contentType = null, CancellationToken ct = default);

    Task<string> CreatePresignedDownloadUrlAsync(string bucket, string key, TimeSpan expiry, CancellationToken ct = default);

    Task<bool> ObjectExistsAsync(string bucket, string key, CancellationToken ct = default);

    Task<long> GetObjectSizeAsync(string bucket, string key, CancellationToken ct = default);

    Task DeleteAsync(string bucket, string key, CancellationToken ct = default);

    Task<Stream> GetAsync(string bucket, string key, CancellationToken ct = default);

    Task PutAsync(string bucket, string key, Stream content, string contentType, CancellationToken ct = default);
}
