using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.Content.API.Domain;
using DijitalAtolye.Content.API.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Content.API.Endpoints;

public static class ContentStatsEndpoints
{
    public static IEndpointRouteBuilder MapContentStatsEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/contents/admin/stats", async (ContentDbContext db, CancellationToken ct) =>
        {
            var today = DateTime.UtcNow.Date;
            var autoRejected = await db.Contents.CountAsync(c => c.State == ContentState.AutoRejected, ct);
            var aiModerated = await db.Contents.CountAsync(c =>
                c.State == ContentState.AutoRejected
                || c.State >= ContentState.AIReviewed, ct);
            var aiPassed = Math.Max(0, aiModerated - autoRejected);
            var aiApprovalRatePercent = aiModerated > 0
                ? Math.Round(aiPassed * 100.0 / aiModerated, 1)
                : 0.0;

            var topTeachers = await db.Contents.AsNoTracking()
                .GroupBy(c => c.AuthorUserId)
                .Select(g => new { authorId = g.Key, count = g.Count() })
                .OrderByDescending(x => x.count)
                .Take(5)
                .ToListAsync(ct);

            return Results.Ok(new
            {
                totalContents = await db.Contents.CountAsync(ct),
                pendingReview = await db.Contents.CountAsync(c => c.State == ContentState.EditorReviewing, ct),
                publishedToday = await db.Contents.CountAsync(c => c.PublishedAtUtc >= today, ct),
                publishedTotal = await db.Contents.CountAsync(c => c.State == ContentState.Published, ct),
                aiAutoRejected = autoRejected,
                aiApprovalRatePercent,
                topTeachers = topTeachers.Select(t => new
                {
                    authorId = t.authorId,
                    name = t.authorId.ToString()[..8],
                    contents = t.count,
                }),
            });
        }).RequireAuthorization(Policies.AdminOnly).WithTags("Admin");

        return app;
    }
}
