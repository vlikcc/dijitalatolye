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

        g.MapPost("/{id:guid}/rating", async (
            Guid id,
            [FromBody] RateContentRequest req,
            ContentDbContext db,
            ICurrentUser cu,
            CancellationToken ct) =>
        {
            if (cu.UserId is null) return Results.Unauthorized();
            if (req.Score is < 1 or > 5) return Results.BadRequest("Score must be 1-5");
            var rating = await db.Ratings.FirstOrDefaultAsync(r => r.ContentId == id && r.UserId == cu.UserId, ct);
            if (rating is null)
            {
                rating = new ContentRating { ContentId = id, UserId = cu.UserId.Value, Score = req.Score };
                db.Ratings.Add(rating);
            }
            else
            {
                rating.Score = req.Score;
                rating.UpdatedAt = DateTime.UtcNow;
            }
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { rating.Score });
        });

        g.MapGet("/{id:guid}/rating", async (Guid id, ContentDbContext db, ICurrentUser cu, CancellationToken ct) =>
        {
            var mine = cu.UserId is null
                ? null
                : await db.Ratings.AsNoTracking()
                    .Where(r => r.ContentId == id && r.UserId == cu.UserId)
                    .Select(r => (int?)r.Score)
                    .FirstOrDefaultAsync(ct);
            var summary = await db.Ratings.AsNoTracking()
                .Where(r => r.ContentId == id)
                .GroupBy(_ => 1)
                .Select(g => new { average = g.Average(r => r.Score), count = g.Count() })
                .FirstOrDefaultAsync(ct);
            return Results.Ok(new
            {
                userScore = mine,
                average = summary?.average ?? 0,
                count = summary?.count ?? 0,
            });
        }).AllowAnonymous();

        return app;
    }

    public sealed record AddCommentRequest(string Body);
    public sealed record RateContentRequest(int Score);
}
