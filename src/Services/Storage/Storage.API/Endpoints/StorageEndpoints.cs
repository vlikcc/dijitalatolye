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

    private static string Sanitize(string fileName)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var clean = new string(fileName.Where(c => !invalid.Contains(c) && c != '/' && c != '\\').ToArray());
        return clean.Length == 0 ? "file" : clean;
    }
}

public sealed record PresignedUploadRequest(string FileName, string ContentType, string Purpose);
public sealed record PresignedUploadResponse(string Url, string Bucket, string Key, DateTime ExpiresAtUtc);
public sealed record ScanRequest(string Bucket, string Key);
