using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.User.API.Domain;
using DijitalAtolye.User.API.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.User.API.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder routes)
    {
        var users = routes.MapGroup("/users").WithTags("Users").RequireAuthorization();

        users.MapGet("/me", async (
            ICurrentUser current,
            UserDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null)
            {
                return Results.Unauthorized();
            }
            var profile = await db.Profiles.AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == current.UserId, ct);
            return profile is null ? Results.NotFound() : Results.Json(profile);
        });

        // Öğretmenin sınıfına eklemek üzere kayıtlı öğrencileri arar (email/ad).
        users.MapGet("/students", async (
            [FromQuery] string? q,
            UserDbContext db,
            CancellationToken ct) =>
        {
            var term = (q ?? string.Empty).Trim();
            if (term.Length < 2) return Results.Ok(Array.Empty<object>());
            var like = $"%{term}%";
            var students = await db.Profiles.AsNoTracking()
                .Where(p => p.PrimaryRole == "Student"
                    && (EF.Functions.ILike(p.Email, like) || EF.Functions.ILike(p.DisplayName, like)))
                .OrderBy(p => p.DisplayName)
                .Take(20)
                .Select(p => new { userId = p.UserId, email = p.Email, displayName = p.DisplayName })
                .ToListAsync(ct);
            return Results.Ok(students);
        }).RequireAuthorization(Policies.TeacherOrAbove);

        // Verilen kullanıcı id'leri için görünen ad çözümlemesi (admin raporlarında öğretmen adı vb.).
        users.MapGet("/names", async (
            [FromQuery] string? ids,
            UserDbContext db,
            CancellationToken ct) =>
        {
            var guids = (ids ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => Guid.TryParse(s, out var g) ? g : (Guid?)null)
                .Where(g => g is not null).Select(g => g!.Value).Distinct().Take(50).ToList();
            if (guids.Count == 0) return Results.Ok(Array.Empty<object>());
            var rows = await db.Profiles.AsNoTracking()
                .Where(p => guids.Contains(p.UserId))
                .Select(p => new { userId = p.UserId, displayName = p.DisplayName })
                .ToListAsync(ct);
            return Results.Ok(rows);
        }).RequireAuthorization(Policies.TeacherOrAbove);

        users.MapPut("/me", async (
            [FromBody] UpdateProfileRequest body,
            ICurrentUser current,
            UserDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null)
            {
                return Results.Unauthorized();
            }
            var profile = await db.Profiles.FirstOrDefaultAsync(p => p.UserId == current.UserId, ct);
            if (profile is null)
            {
                profile = new UserProfile { UserId = current.UserId.Value, Email = current.Email ?? "" };
                db.Profiles.Add(profile);
            }
            profile.DisplayName = body.DisplayName ?? profile.DisplayName;
            profile.FullName = body.FullName;
            profile.Bio = body.Bio;
            profile.Subject = body.Subject;
            profile.SchoolName = body.SchoolName;
            profile.City = body.City;
            profile.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        users.MapPost("/me/teacher-verification", async (
            [FromBody] TeacherVerificationRequest body,
            ICurrentUser current,
            UserDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null)
            {
                return Results.Unauthorized();
            }
            var profile = await db.Profiles.FirstOrDefaultAsync(p => p.UserId == current.UserId, ct);
            if (profile is null)
            {
                return Results.NotFound();
            }
            profile.TeacherVerification = body.MebEmail.EndsWith("@meb.k12.tr", StringComparison.OrdinalIgnoreCase)
                ? TeacherVerificationStatus.PendingMebEmail
                : TeacherVerificationStatus.PendingManualReview;
            profile.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Accepted($"/users/{current.UserId}", new { profile.TeacherVerification });
        });

        return routes;
    }
}

public sealed record UpdateProfileRequest(
    string? DisplayName,
    string? FullName,
    string? Bio,
    string? Subject,
    string? SchoolName,
    string? City);

public sealed record TeacherVerificationRequest(string MebEmail, string? Notes);
