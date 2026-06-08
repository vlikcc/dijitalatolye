using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.Notification.API.Domain;
using DijitalAtolye.Notification.API.Persistence;
using DijitalAtolye.Notification.API.Push;
using Microsoft.AspNetCore.Mvc;
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

        // --- Web Push (VAPID) ---

        grp.MapGet("/push/public-key", (IPushSender push) =>
            Results.Ok(new { publicKey = push.PublicKey, enabled = push.Enabled }));

        grp.MapPost("/push/subscribe", async (
            [FromBody] PushSubscribeRequest body,
            ICurrentUser current,
            NotificationDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(body.Endpoint) || string.IsNullOrWhiteSpace(body.P256dh) || string.IsNullOrWhiteSpace(body.Auth))
                return Results.BadRequest("Eksik abonelik bilgisi.");

            var existing = await db.PushSubscriptions.FirstOrDefaultAsync(s => s.Endpoint == body.Endpoint, ct);
            if (existing is null)
            {
                db.PushSubscriptions.Add(new PushSubscriptionEntity
                {
                    UserId = current.UserId.Value,
                    Endpoint = body.Endpoint,
                    P256dh = body.P256dh,
                    Auth = body.Auth,
                });
            }
            else
            {
                existing.UserId = current.UserId.Value;
                existing.P256dh = body.P256dh;
                existing.Auth = body.Auth;
            }
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        grp.MapPost("/push/unsubscribe", async (
            [FromBody] PushUnsubscribeRequest body,
            ICurrentUser current,
            NotificationDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var sub = await db.PushSubscriptions.FirstOrDefaultAsync(s => s.Endpoint == body.Endpoint && s.UserId == current.UserId, ct);
            if (sub is not null) { db.PushSubscriptions.Remove(sub); await db.SaveChangesAsync(ct); }
            return Results.NoContent();
        });

        return routes;
    }
}

public sealed record PushSubscribeRequest(string Endpoint, string P256dh, string Auth);
public sealed record PushUnsubscribeRequest(string Endpoint);
