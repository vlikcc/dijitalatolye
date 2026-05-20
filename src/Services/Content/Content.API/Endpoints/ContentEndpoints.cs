using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Content;
using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.Content.API.Bundles;
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
                TargetAge = body.TargetAge,
                DurationMinutes = body.DurationMinutes,
                Difficulty = NormalizeDifficulty(body.Difficulty),
                CoverImageBucket = body.CoverImageBucket,
                CoverImageKey = body.CoverImageKey,
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
            IOutboxWriter outbox,
            BundleValidator validator,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var content = await db.Contents.Include(c => c.Versions)
                .FirstOrDefaultAsync(c => c.Id == id, ct);
            if (content is null) return Results.NotFound();
            if (content.AuthorUserId != current.UserId) return Results.Forbid();

            BundleValidationResult validation;
            try
            {
                validation = await validator.ValidateAsync(body.Bucket, body.Key, body.ManifestEntry, ct);
            }
            catch (BundleValidationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }

            var nextNum = content.Versions.Count == 0 ? 1 : content.Versions.Max(v => v.VersionNumber) + 1;
            var version = new ContentVersion
            {
                ContentId = id,
                VersionNumber = nextNum,
                StorageBucket = body.Bucket,
                StorageKey = body.Key,
                ManifestEntry = validation.ManifestEntry,
                ManifestJson = validation.ManifestJson,
                FileSizeBytes = validation.SizeBytes,
                Sha256 = validation.Sha256,
                CreatedByUserId = current.UserId.Value,
                ChangeLog = body.ChangeLog,
            };
            db.Versions.Add(version);
            content.CurrentVersionId = version.Id;
            content.UpdatedAtUtc = DateTime.UtcNow;

            await outbox.WriteAsync(new DijitalAtolye.BuildingBlocks.EventBus.Contracts.Storage.FileUploadedV1
            {
                ContentId = content.Id,
                VersionId = version.Id,
                Bucket = version.StorageBucket,
                Key = version.StorageKey
            }, ct: ct);

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

        contents.MapGet("/mine", async (
            ICurrentUser current,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var items = await db.Contents.AsNoTracking()
                .Where(c => c.AuthorUserId == current.UserId)
                .OrderByDescending(c => c.UpdatedAtUtc)
                .Take(50)
                .Select(c => new
                {
                    c.Id,
                    c.Title,
                    State = c.State.ToString(),
                    Status = c.State.ToString(),
                    Subject = c.Subject,
                    Grade = c.GradeLevel.ToString(),
                    GradeLevel = c.GradeLevel,
                    UpdatedAt = c.UpdatedAtUtc,
                    UpdatedAtUtc = c.UpdatedAtUtc,
                    CreatedAtUtc = c.CreatedAtUtc,
                })
                .ToListAsync(ct);
            return Results.Ok(items);
        });

        contents.MapGet("/all", async (
            int? pageSize,
            ICurrentUser current,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null
                || (!current.IsInRole(Roles.Admin) && !current.IsInRole(Roles.SuperAdmin)))
                return Results.Forbid();

            var items = await db.Contents.AsNoTracking()
                .OrderByDescending(c => c.CreatedAtUtc)
                .Take(pageSize ?? 50)
                .Select(c => new {
                    c.Id,
                    c.Title,
                    State = c.State.ToString(),
                    AuthorEmail = c.AuthorUserId.ToString(), // Simplification since user email isn't in Content DB
                    c.CreatedAtUtc
                })
                .ToListAsync(ct);
                
            return Results.Ok(new { items });
        });

        contents.MapPost("/{id:guid}/revise", async (
            Guid id,
            ICurrentUser current,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var content = await db.Contents.FirstOrDefaultAsync(c => c.Id == id, ct);
            if (content is null) return Results.NotFound();
            if (content.AuthorUserId != current.UserId) return Results.Forbid();
            if (!content.CanTransitionTo(ContentState.Draft))
                return Results.Conflict($"Mevcut durumdan revize edilemez: {content.State}");

            content.TransitionTo(ContentState.Draft);
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { content.Id, content.State });
        }).RequireAuthorization(Policies.TeacherOrAbove);

        contents.MapPut("/{id:guid}/metadata", async (
            Guid id,
            [FromBody] UpdateMetadataRequest body,
            ICurrentUser current,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var content = await db.Contents.FirstOrDefaultAsync(c => c.Id == id, ct);
            if (content is null) return Results.NotFound();
            if (content.AuthorUserId != current.UserId) return Results.Forbid();
            if (content.State is not (ContentState.Draft or ContentState.RevisionRequested))
                return Results.Conflict("Sadece Draft veya RevisionRequested durumda metadata güncellenebilir.");

            content.Title = body.Title ?? content.Title;
            content.Description = body.Description ?? content.Description;
            content.Subject = body.Subject ?? content.Subject;
            content.GradeLevel = body.GradeLevel ?? content.GradeLevel;
            if (body.OutcomeCodes is not null) content.OutcomeCodes = body.OutcomeCodes.ToList();
            if (body.Tags is not null) content.Tags = body.Tags.ToList();
            content.TargetAge = body.TargetAge ?? content.TargetAge;
            content.DurationMinutes = body.DurationMinutes ?? content.DurationMinutes;
            content.Difficulty = NormalizeDifficulty(body.Difficulty) ?? content.Difficulty;
            if (body.CoverImageBucket is not null) content.CoverImageBucket = body.CoverImageBucket;
            if (body.CoverImageKey is not null) content.CoverImageKey = body.CoverImageKey;
            content.UpdatedAtUtc = DateTime.UtcNow;

            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        }).RequireAuthorization(Policies.TeacherOrAbove);

        contents.MapGet("/{id:guid}", async (
            Guid id,
            ICurrentUser current,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();

            var content = await db.Contents.AsNoTracking()
                .Include(c => c.Versions)
                .FirstOrDefaultAsync(c => c.Id == id, ct);
            if (content is null) return Results.NotFound();
            if (!CanReadContent(content, current)) return Results.Forbid();

            return Results.Json(content);
        });

        return routes;
    }

    public static bool CanReadContent(Domain.Content content, ICurrentUser current)
    {
        if (current.IsInRole(Roles.Admin) || current.IsInRole(Roles.SuperAdmin))
            return true;
        if (content.AuthorUserId == current.UserId)
            return true;
        if (content.State is ContentState.Published or ContentState.Unpublished)
            return true;
        if (current.IsInRole(Roles.Editor)
            && content.State is ContentState.EditorReviewing
                or ContentState.AIReviewed
                or ContentState.Submitted
                or ContentState.AIReviewing)
            return true;
        return false;
    }

    private static string? NormalizeDifficulty(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return value.Trim().ToLowerInvariant() switch
        {
            "easy" or "kolay" => "Easy",
            "medium" or "orta" => "Medium",
            "hard" or "zor" => "Hard",
            _ => null,
        };
    }
}

public sealed record CreateContentRequest(
    string Title,
    string? Description,
    string Subject,
    int? GradeLevel,
    string[] OutcomeCodes,
    string[] Tags,
    int? TargetAge = null,
    int? DurationMinutes = null,
    string? Difficulty = null,
    string? CoverImageBucket = null,
    string? CoverImageKey = null);

public sealed record UpdateMetadataRequest(
    string? Title,
    string? Description,
    string? Subject,
    int? GradeLevel,
    string[]? OutcomeCodes,
    string[]? Tags,
    int? TargetAge,
    int? DurationMinutes,
    string? Difficulty,
    string? CoverImageBucket,
    string? CoverImageKey);

public sealed record AddVersionRequest(
    string Bucket,
    string Key,
    string? ManifestEntry,
    string? ManifestJson,
    long FileSizeBytes,
    string? Sha256,
    string? ChangeLog);
