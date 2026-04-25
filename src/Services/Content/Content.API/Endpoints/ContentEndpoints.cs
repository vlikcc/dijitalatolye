using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Content;
using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.Content.API.Domain;
using DijitalAtolye.Content.API.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Content.API.Endpoints;

public static class ContentEndpoints
{
    public static IEndpointRouteBuilder MapContentEndpoints(this IEndpointRouteBuilder routes)
    {
        var contents = routes.MapGroup("/contents").WithTags("Contents").RequireAuthorization();

        contents.MapPost("/", async (
            [FromBody] CreateContentRequest body,
            ICurrentUser current,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var content = new Domain.Content
            {
                AuthorUserId = current.UserId.Value,
                Title = body.Title,
                Description = body.Description,
                Subject = body.Subject,
                GradeLevel = body.GradeLevel,
                OutcomeCodes = body.OutcomeCodes.ToList(),
                Tags = body.Tags.ToList(),
            };
            db.Contents.Add(content);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/contents/{content.Id}", new { content.Id, content.State });
        }).RequireAuthorization(Policies.TeacherOrAbove);

        contents.MapPost("/{id:guid}/versions", async (
            Guid id,
            [FromBody] AddVersionRequest body,
            ICurrentUser current,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var content = await db.Contents.Include(c => c.Versions)
                .FirstOrDefaultAsync(c => c.Id == id, ct);
            if (content is null) return Results.NotFound();
            if (content.AuthorUserId != current.UserId) return Results.Forbid();

            var nextNum = content.Versions.Count == 0 ? 1 : content.Versions.Max(v => v.VersionNumber) + 1;
            var version = new ContentVersion
            {
                ContentId = id,
                VersionNumber = nextNum,
                StorageBucket = body.Bucket,
                StorageKey = body.Key,
                ManifestEntry = body.ManifestEntry ?? "index.html",
                ManifestJson = body.ManifestJson,
                FileSizeBytes = body.FileSizeBytes,
                Sha256 = body.Sha256,
                CreatedByUserId = current.UserId.Value,
                ChangeLog = body.ChangeLog,
            };
            db.Versions.Add(version);
            content.CurrentVersionId = version.Id;
            content.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Created($"/contents/{id}/versions/{version.Id}", version);
        }).RequireAuthorization(Policies.TeacherOrAbove);

        contents.MapPost("/{id:guid}/submit", async (
            Guid id,
            ICurrentUser current,
            ContentDbContext db,
            IOutboxWriter outbox,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var content = await db.Contents.Include(c => c.Versions)
                .FirstOrDefaultAsync(c => c.Id == id, ct);
            if (content is null) return Results.NotFound();
            if (content.AuthorUserId != current.UserId) return Results.Forbid();
            if (content.CurrentVersionId is null) return Results.BadRequest("Önce en az bir versiyon yüklenmeli.");
            if (!content.CanTransitionTo(ContentState.Submitted))
            {
                return Results.Conflict($"Mevcut durumda gönderilemez: {content.State}");
            }

            content.TransitionTo(ContentState.Submitted);
            var current_v = content.Versions.First(v => v.Id == content.CurrentVersionId);

            await outbox.WriteAsync(new ContentSubmittedV1
            {
                ContentId = content.Id,
                VersionId = current_v.Id,
                AuthorUserId = content.AuthorUserId,
                ManifestEntry = current_v.ManifestEntry,
                StorageKey = current_v.StorageKey,
                Title = content.Title,
                OutcomeCodes = content.OutcomeCodes.AsReadOnly(),
                Tags = content.Tags.AsReadOnly(),
                GradeLevel = content.GradeLevel,
                Subject = content.Subject,
            }, ct: ct);

            await db.SaveChangesAsync(ct);
            return Results.Accepted($"/contents/{id}", new { content.Id, content.State });
        }).RequireAuthorization(Policies.TeacherOrAbove);

        contents.MapGet("/", async (
            ICurrentUser current,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var items = await db.Contents.AsNoTracking()
                .Where(c => c.AuthorUserId == current.UserId)
                .OrderByDescending(c => c.UpdatedAtUtc)
                .Take(50)
                .ToListAsync(ct);
            return Results.Json(items);
        });

        contents.MapGet("/{id:guid}", async (Guid id, ContentDbContext db, CancellationToken ct) =>
        {
            var content = await db.Contents.AsNoTracking()
                .Include(c => c.Versions)
                .FirstOrDefaultAsync(c => c.Id == id, ct);
            return content is null ? Results.NotFound() : Results.Json(content);
        });

        return routes;
    }
}

public sealed record CreateContentRequest(
    string Title,
    string? Description,
    string Subject,
    int? GradeLevel,
    string[] OutcomeCodes,
    string[] Tags);

public sealed record AddVersionRequest(
    string Bucket,
    string Key,
    string? ManifestEntry,
    string? ManifestJson,
    long FileSizeBytes,
    string? Sha256,
    string? ChangeLog);
