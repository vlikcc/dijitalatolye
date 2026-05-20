using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.User.API.Domain;
using DijitalAtolye.User.API.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.User.API.Endpoints;

public static class NotificationPreferenceEndpoints
{
    public static IEndpointRouteBuilder MapNotificationPreferenceEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/users/me/notification-preferences")
            .WithTags("NotificationPreferences")
            .RequireAuthorization();

        group.MapGet("/", async (ICurrentUser current, UserDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var prefs = await db.NotificationPreferences.AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == current.UserId, ct);
            return Results.Ok(prefs ?? new NotificationPreference { UserId = current.UserId.Value });
        });

        group.MapPut("/", async (
            [FromBody] UpdateNotificationPreferencesRequest body,
            ICurrentUser current,
            UserDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var prefs = await db.NotificationPreferences.FirstOrDefaultAsync(p => p.UserId == current.UserId, ct);
            if (prefs is null)
            {
                prefs = new NotificationPreference { UserId = current.UserId.Value };
                db.NotificationPreferences.Add(prefs);
            }
            if (body.EmailEnabled is not null) prefs.EmailEnabled = body.EmailEnabled.Value;
            if (body.InAppEnabled is not null) prefs.InAppEnabled = body.InAppEnabled.Value;
            if (body.ContentUpdates is not null) prefs.ContentUpdates = body.ContentUpdates.Value;
            if (body.MarketingEmails is not null) prefs.MarketingEmails = body.MarketingEmails.Value;
            prefs.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Ok(prefs);
        });

        return routes;
    }
}

public sealed record UpdateNotificationPreferencesRequest(
    bool? EmailEnabled,
    bool? InAppEnabled,
    bool? ContentUpdates,
    bool? MarketingEmails);
