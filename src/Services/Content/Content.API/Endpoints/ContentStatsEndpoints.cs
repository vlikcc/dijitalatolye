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
            return Results.Ok(new
            {
                totalContents = await db.Contents.CountAsync(ct),
                pendingReview = await db.Contents.CountAsync(c => c.State == ContentState.EditorReviewing, ct),
                publishedToday = await db.Contents.CountAsync(c => c.PublishedAtUtc >= today, ct),
                publishedTotal = await db.Contents.CountAsync(c => c.State == ContentState.Published, ct),
            });
        }).RequireAuthorization(Policies.AdminOnly).WithTags("Admin");

        return app;
    }
}
