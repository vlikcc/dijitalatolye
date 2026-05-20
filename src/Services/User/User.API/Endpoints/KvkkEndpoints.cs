using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.User.API.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.User.API.Endpoints;

/// <summary>
/// KVKK kapsamında veri sahibinin haklari (erisim, silme/anonimlestirme, dışa aktarım).
/// V1: Profil verileri uzerinden export ve anonimlestirme. Icerik silme talebi ayrı bir
/// admin moderasyon kuyrugundan ilerler.
/// </summary>
public static class KvkkEndpoints
{
    public static IEndpointRouteBuilder MapKvkkEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/users/me/kvkk").RequireAuthorization().WithTags("KVKK");

        group.MapGet("/export", async (ICurrentUser current, UserDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var profile = await db.Profiles.AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == current.UserId, ct);
            var payload = new
            {
                exportedAt = DateTime.UtcNow,
                userId = current.UserId,
                email = current.Email,
                roles = current.Roles,
                profile,
                note = "Icerik ve etkilesim verileri Content/Analytics servisinden ayrı talep edilmelidir.",
            };
            return Results.Json(payload, contentType: "application/json");
        });

        group.MapPost("/anonymize", async (ICurrentUser current, UserDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var profile = await db.Profiles.FirstOrDefaultAsync(p => p.UserId == current.UserId, ct);
            if (profile is null) return Results.NotFound();
            profile.DisplayName = $"silinmis-kullanici-{current.UserId.ToString()![..8]}";
            profile.FullName = null;
            profile.Bio = null;
            profile.SchoolName = null;
            profile.City = null;
            profile.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Accepted(value: new { status = "anonymized", userId = current.UserId });
        });

        group.MapPost("/delete-request", async (ICurrentUser current, UserDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var profile = await db.Profiles.FirstOrDefaultAsync(p => p.UserId == current.UserId, ct);
            if (profile is null) return Results.NotFound();
            profile.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Accepted(value: new
            {
                status = "delete_requested",
                userId = current.UserId,
                message = "Hesap silme talebiniz alındı. 30 gün içinde işleme alınacaktır.",
            });
        });

        return routes;
    }
}
