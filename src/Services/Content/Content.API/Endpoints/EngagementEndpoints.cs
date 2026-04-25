using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.Content.API.Domain;
using DijitalAtolye.Content.API.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Content.API.Endpoints;

public static class EngagementEndpoints
{
    public static IEndpointRouteBuilder MapEngagementEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/contents").WithTags("Engagement").RequireAuthorization();

        g.MapPost("/{id:guid}/like", async (Guid id, ContentDbContext db, ICurrentUser cu, CancellationToken ct) =>
        {
            if (cu.UserId is null) return Results.Unauthorized();
            var exists = await db.Likes.AnyAsync(l => l.ContentId == id && l.UserId == cu.UserId, ct);
            if (!exists)
            {
                db.Likes.Add(new ContentLike { ContentId = id, UserId = cu.UserId.Value });
                await db.SaveChangesAsync(ct);
            }
            var count = await db.Likes.CountAsync(l => l.ContentId == id, ct);
            return Results.Ok(new { liked = true, count });
        });

        g.MapDelete("/{id:guid}/like", async (Guid id, ContentDbContext db, ICurrentUser cu, CancellationToken ct) =>
        {
            if (cu.UserId is null) return Results.Unauthorized();
            var like = await db.Likes.FirstOrDefaultAsync(l => l.ContentId == id && l.UserId == cu.UserId, ct);
            if (like is not null)
            {
                db.Likes.Remove(like);
                await db.SaveChangesAsync(ct);
            }
            var count = await db.Likes.CountAsync(l => l.ContentId == id, ct);
            return Results.Ok(new { liked = false, count });
        });

        g.MapPost("/{id:guid}/favorite", async (Guid id, ContentDbContext db, ICurrentUser cu, CancellationToken ct) =>
        {
            if (cu.UserId is null) return Results.Unauthorized();
            if (!await db.Favorites.AnyAsync(f => f.ContentId == id && f.UserId == cu.UserId, ct))
            {
                db.Favorites.Add(new ContentFavorite { ContentId = id, UserId = cu.UserId.Value });
                await db.SaveChangesAsync(ct);
            }
            return Results.Ok();
        });

        g.MapDelete("/{id:guid}/favorite", async (Guid id, ContentDbContext db, ICurrentUser cu, CancellationToken ct) =>
        {
            var fav = await db.Favorites.FirstOrDefaultAsync(f => f.ContentId == id && f.UserId == cu.UserId, ct);
            if (fav is not null)
            {
                db.Favorites.Remove(fav);
                await db.SaveChangesAsync(ct);
            }
            return Results.Ok();
        });

        g.MapGet("/{id:guid}/comments", async (Guid id, ContentDbContext db, CancellationToken ct) =>
        {
            var items = await db.Comments
                .Where(c => c.ContentId == id && !c.IsHidden)
                .OrderByDescending(c => c.CreatedAt)
                .Take(100)
                .ToListAsync(ct);
            return Results.Ok(items);
        }).AllowAnonymous();

        g.MapPost("/{id:guid}/comments", async (
            Guid id,
            [FromBody] AddCommentRequest req,
            ContentDbContext db,
            ICurrentUser cu,
            CancellationToken ct) =>
        {
            if (cu.UserId is null) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(req.Body)) return Results.BadRequest("Body required");
            var comment = new ContentComment
            {
                ContentId = id,
                UserId = cu.UserId.Value,
                Body = req.Body.Trim(),
            };
            db.Comments.Add(comment);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/contents/{id}/comments/{comment.Id}", comment);
        });

        g.MapGet("/me/favorites", async (ContentDbContext db, ICurrentUser cu, CancellationToken ct) =>
        {
            if (cu.UserId is null) return Results.Unauthorized();
            var ids = await db.Favorites
                .Where(f => f.UserId == cu.UserId)
                .Select(f => f.ContentId)
                .ToListAsync(ct);
            var items = await db.Contents.Where(c => ids.Contains(c.Id)).ToListAsync(ct);
            return Results.Ok(items);
        });

        return app;
    }

    public sealed record AddCommentRequest(string Body);
}
