using DijitalAtolye.Content.API.Domain;
using DijitalAtolye.Content.API.Persistence;
using Microsoft.EntityFrameworkCore;
using Minio;
using Minio.DataModel.Args;

namespace DijitalAtolye.Content.API.Endpoints;

public static class PlayEndpoints
{
    public static IEndpointRouteBuilder MapPlayEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/contents").WithTags("Play").AllowAnonymous();

        group.MapGet("/by-slug/{slug}/play", async (
            string slug,
            ContentDbContext db,
            PlayPresignClient presign,
            ContentMinioOptions minioOpts,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(slug)) return Results.NotFound();

            var content = await db.Contents.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Slug == slug, ct);

            if (content is null) return Results.NotFound();
            if (content.State != ContentState.Published && content.State != ContentState.Approved)
                return Results.NotFound();
            if (content.CurrentVersionId is null) return Results.NotFound();

            // Yayında olan içerikler `published` bucket'ında public-read olarak duruyor; doğrudan public URL'e
            // yönlendirmek hem iframe asset'lerinin (göreceli yollar) çalışmasını sağlar hem de signature gerektirmez.
            if (!string.IsNullOrWhiteSpace(content.PublishedBucket) && !string.IsNullOrWhiteSpace(content.PublishedKey))
            {
                var publicBase = string.IsNullOrWhiteSpace(minioOpts.PublicEndpoint)
                    ? $"http://{minioOpts.Endpoint}"
                    : minioOpts.PublicEndpoint.TrimEnd('/');
                return Results.Redirect($"{publicBase}/{content.PublishedBucket}/{content.PublishedKey}");
            }

            // Fallback: extract olmamış (eski) içerikler için presigned URL.
            var version = await db.Versions.AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == content.CurrentVersionId, ct);
            if (version is null) return Results.NotFound();
            var args = new PresignedGetObjectArgs()
                .WithBucket(version.StorageBucket)
                .WithObject(version.StorageKey)
                .WithExpiry((int)TimeSpan.FromMinutes(15).TotalSeconds);
            var url = await presign.Client.PresignedGetObjectAsync(args);
            return Results.Redirect(url);
        });

        return routes;
    }
}

public sealed class PlayPresignClient
{
    public IMinioClient Client { get; }
    public PlayPresignClient(IMinioClient client) { Client = client; }
}

public sealed class ContentMinioOptions
{
    public string Endpoint { get; init; } = "minio:9000";
    public string AccessKey { get; init; } = string.Empty;
    public string SecretKey { get; init; } = string.Empty;
    public bool UseSsl { get; init; }
    public string PublicEndpoint { get; init; } = string.Empty;
}
