using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.Notification.API.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Notification.API.Endpoints;

public static class NotificationEndpoints
{
    public static IEndpointRouteBuilder MapNotificationEndpoints(this IEndpointRouteBuilder routes)
    {
        var grp = routes.MapGroup("/notifications").WithTags("Notifications").RequireAuthorization();

        grp.MapGet("/me", async (ICurrentUser current, NotificationDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var items = await db.Notifications.AsNoTracking()
                .Where(n => n.UserId == current.UserId)
                .OrderByDescending(n => n.CreatedAtUtc)
                .Take(50)
                .ToListAsync(ct);
            return Results.Json(items);
        });

        grp.MapPost("/{id:guid}/read", async (Guid id, ICurrentUser current, NotificationDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var n = await db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == current.UserId, ct);
            if (n is null) return Results.NotFound();
            n.ReadAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        return routes;
    }
}
