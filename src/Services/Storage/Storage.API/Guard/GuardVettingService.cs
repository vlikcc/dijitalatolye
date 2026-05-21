using System.Security.Cryptography;
using Microsoft.Extensions.Options;

namespace DijitalAtolye.Storage.API.Guard;

public interface IFileVettingService
{
    Task<GuardUploadResponse> SubmitAsync(VettingSubmission submission, CancellationToken ct = default);
}

public sealed record VettingSubmission(
    Stream Content,
    string OriginalFileName,
    Guid ContentId,
    Guid VersionId,
    string Bucket,
    string Key,
    string? UploadedByExternalId = null);

public sealed class GuardVettingService : IFileVettingService
{
    private readonly IGuardClient _client;

    public GuardVettingService(IGuardClient client) => _client = client;

    public async Task<GuardUploadResponse> SubmitAsync(VettingSubmission submission, CancellationToken ct = default)
    {
        var sha256 = await ComputeSha256HexAsync(submission.Content, ct);
        if (submission.Content.CanSeek)
        {
            submission.Content.Position = 0;
        }

        return await _client.UploadAsync(new GuardUploadRequest(
            submission.Content,
            submission.OriginalFileName,
            sha256,
            GuardSourceContentId.Encode(submission.ContentId, submission.VersionId, submission.Bucket, submission.Key),
            submission.UploadedByExternalId), ct);
    }

    private static async Task<string> ComputeSha256HexAsync(Stream content, CancellationToken ct)
    {
        using var sha = SHA256.Create();
        var hash = await sha.ComputeHashAsync(content, ct);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
