using Minio;
using Minio.DataModel.Args;

namespace DijitalAtolye.Storage.API.Storage;

public sealed class MinioObjectStorage : IObjectStorage
{
    private readonly IMinioClient _minio;

    public MinioObjectStorage(IMinioClient minio)
    {
        _minio = minio;
    }

    public async Task<string> CreatePresignedUploadUrlAsync(string bucket, string key, TimeSpan expiry, string? contentType = null, CancellationToken ct = default)
    {
        await EnsureBucketAsync(bucket, ct);
        var args = new PresignedPutObjectArgs()
            .WithBucket(bucket)
            .WithObject(key)
            .WithExpiry((int)expiry.TotalSeconds);
        return await _minio.PresignedPutObjectAsync(args);
    }

    public async Task<string> CreatePresignedDownloadUrlAsync(string bucket, string key, TimeSpan expiry, CancellationToken ct = default)
    {
        var args = new PresignedGetObjectArgs()
            .WithBucket(bucket)
            .WithObject(key)
            .WithExpiry((int)expiry.TotalSeconds);
        return await _minio.PresignedGetObjectAsync(args);
    }

    public async Task<bool> ObjectExistsAsync(string bucket, string key, CancellationToken ct = default)
    {
        try
        {
            await _minio.StatObjectAsync(new StatObjectArgs().WithBucket(bucket).WithObject(key), ct);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<long> GetObjectSizeAsync(string bucket, string key, CancellationToken ct = default)
    {
        var stat = await _minio.StatObjectAsync(new StatObjectArgs().WithBucket(bucket).WithObject(key), ct);
        return stat.Size;
    }

    public async Task DeleteAsync(string bucket, string key, CancellationToken ct = default)
    {
        await _minio.RemoveObjectAsync(new RemoveObjectArgs().WithBucket(bucket).WithObject(key), ct);
    }

    public async Task<Stream> GetAsync(string bucket, string key, CancellationToken ct = default)
    {
        var ms = new MemoryStream();
        await _minio.GetObjectAsync(new GetObjectArgs()
            .WithBucket(bucket)
            .WithObject(key)
            .WithCallbackStream(s => s.CopyTo(ms)), ct);
        ms.Position = 0;
        return ms;
    }

    public async Task PutAsync(string bucket, string key, Stream content, string contentType, CancellationToken ct = default)
    {
        await EnsureBucketAsync(bucket, ct);
        await _minio.PutObjectAsync(new PutObjectArgs()
            .WithBucket(bucket)
            .WithObject(key)
            .WithStreamData(content)
            .WithObjectSize(content.CanSeek ? content.Length : -1)
            .WithContentType(contentType), ct);
    }

    private async Task EnsureBucketAsync(string bucket, CancellationToken ct)
    {
        var exists = await _minio.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucket), ct);
        if (!exists)
        {
            await _minio.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucket), ct);
        }
    }
}
