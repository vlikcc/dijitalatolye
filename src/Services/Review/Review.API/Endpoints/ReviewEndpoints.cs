using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Review;
using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.Review.API.Domain;
using DijitalAtolye.Review.API.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Review.API.Endpoints;

public static class ReviewEndpoints
{
    public static IEndpointRouteBuilder MapReviewEndpoints(this IEndpointRouteBuilder routes)
    {
        var grp = routes.MapGroup("/review").WithTags("Review")
            .RequireAuthorization(Policies.EditorOrAbove);

        grp.MapGet("/queue", async (ReviewDbContext db, CancellationToken ct) =>
        {
            var items = await db.ReviewItems.AsNoTracking()
                .Where(r => r.Status == ReviewStatus.Queued)
                .OrderByDescending(r => r.Priority)
                .ThenBy(r => r.EnqueuedAtUtc)
                .Take(100)
                .ToListAsync(ct);
            return Results.Json(items);
        });

        grp.MapGet("/{id:guid}", async (Guid id, ReviewDbContext db, CancellationToken ct) =>
        {
            var item = await db.ReviewItems.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, ct);
            return item is null ? Results.NotFound() : Results.Json(item);
        });

        grp.MapPost("/{id:guid}/assign", async (
            Guid id,
            ICurrentUser current,
            ReviewDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var item = await db.ReviewItems.FirstOrDefaultAsync(r => r.Id == id, ct);
            if (item is null) return Results.NotFound();
            if (item.Status != ReviewStatus.Queued) return Results.Conflict("Zaten atanmış veya karar verilmiş.");
            item.Status = ReviewStatus.Assigned;
            item.AssignedEditorId = current.UserId;
            item.AssignedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Ok(item);
        });

        grp.MapPost("/{id:guid}/decision", async (
            Guid id,
            [FromBody] DecisionRequest body,
            ICurrentUser current,
            ReviewDbContext db,
            IOutboxWriter outbox,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var item = await db.ReviewItems.FirstOrDefaultAsync(r => r.Id == id, ct);
            if (item is null) return Results.NotFound();
            if (item.Status == ReviewStatus.Decided) return Results.Conflict("Karar verilmiş.");
            if (item.AssignedEditorId is not null && item.AssignedEditorId != current.UserId)
            {
                return Results.Forbid();
            }
            item.Status = ReviewStatus.Decided;
            item.AssignedEditorId ??= current.UserId;
            item.DecidedAtUtc = DateTime.UtcNow;

            await outbox.WriteAsync(new EditorDecisionMadeV1
            {
                ContentId = item.ContentId,
                VersionId = item.VersionId,
                EditorUserId = current.UserId.Value,
                Decision = body.Decision,
                Comment = body.Comment,
            }, ct: ct);

            await db.SaveChangesAsync(ct);
            return Results.Ok(item);
        });

        return routes;
    }
}

public sealed record DecisionRequest(
    DijitalAtolye.BuildingBlocks.EventBus.Contracts.Review.EditorDecision Decision,
    string? Comment);
