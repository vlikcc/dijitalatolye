using Minio;
using Minio.DataModel.Args;

namespace DijitalAtolye.Storage.API.Storage;

/// <summary>
/// Marker tip: presigned URL üretimi için kullanılan ikinci MinIO client'ı tutar.
/// İmzalanan <c>host</c> header'ı browser'ın gerçekten ulaştığı public endpoint ile aynı olmalı,
/// aksi halde S3 SigV4 doğrulaması <c>SignatureDoesNotMatch</c> ile reddeder.
/// </summary>
public sealed class MinioPresignClient
{
    public IMinioClient Client { get; }
    public MinioPresignClient(IMinioClient client)
    {
        Client = client;
    }
}

public sealed class MinioObjectStorage : IObjectStorage
{
    private readonly IMinioClient _internal;
    private readonly IMinioClient _presign;

    public MinioObjectStorage(IMinioClient internalClient, MinioPresignClient presign)
    {
        _internal = internalClient;
        _presign = presign.Client;
    }

    public async Task<string> CreatePresignedUploadUrlAsync(string bucket, string key, TimeSpan expiry, string? contentType = null, CancellationToken ct = default)
    {
        await EnsureBucketAsync(bucket, ct);
        var args = new PresignedPutObjectArgs()
            .WithBucket(bucket)
            .WithObject(key)
            .WithExpiry((int)expiry.TotalSeconds);
        return await _presign.PresignedPutObjectAsync(args);
    }

    public async Task<string> CreatePresignedDownloadUrlAsync(string bucket, string key, TimeSpan expiry, CancellationToken ct = default)
    {
        var args = new PresignedGetObjectArgs()
            .WithBucket(bucket)
            .WithObject(key)
            .WithExpiry((int)expiry.TotalSeconds);
        return await _presign.PresignedGetObjectAsync(args);
    }

    public async Task<bool> ObjectExistsAsync(string bucket, string key, CancellationToken ct = default)
    {
        try
        {
            await _internal.StatObjectAsync(new StatObjectArgs().WithBucket(bucket).WithObject(key), ct);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<long> GetObjectSizeAsync(string bucket, string key, CancellationToken ct = default)
    {
        var stat = await _internal.StatObjectAsync(new StatObjectArgs().WithBucket(bucket).WithObject(key), ct);
        return stat.Size;
    }

    public async Task DeleteAsync(string bucket, string key, CancellationToken ct = default)
    {
        await _internal.RemoveObjectAsync(new RemoveObjectArgs().WithBucket(bucket).WithObject(key), ct);
    }

    public async Task<Stream> GetAsync(string bucket, string key, CancellationToken ct = default)
    {
        var ms = new MemoryStream();
        await _internal.GetObjectAsync(new GetObjectArgs()
            .WithBucket(bucket)
            .WithObject(key)
            .WithCallbackStream(s => s.CopyTo(ms)), ct);
        ms.Position = 0;
        return ms;
    }

    public async Task PutAsync(string bucket, string key, Stream content, string contentType, CancellationToken ct = default)
    {
        await EnsureBucketAsync(bucket, ct);
        await _internal.PutObjectAsync(new PutObjectArgs()
            .WithBucket(bucket)
            .WithObject(key)
            .WithStreamData(content)
            .WithObjectSize(content.CanSeek ? content.Length : -1)
            .WithContentType(contentType), ct);
    }

    private async Task EnsureBucketAsync(string bucket, CancellationToken ct)
    {
        var exists = await _internal.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucket), ct);
        if (!exists)
        {
            await _internal.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucket), ct);
        }
    }
}
