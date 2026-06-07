using System.Security.Cryptography;
using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Assignment;
using DijitalAtolye.User.API.Domain;
using DijitalAtolye.User.API.Persistence;
using MassTransit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.User.API.Endpoints;

public static class AssignmentEndpoints
{
    private const string JoinCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // benzeyen 0/O/1/I çıkarıldı

    public static IEndpointRouteBuilder MapAssignmentEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/assignments").WithTags("Assignments").RequireAuthorization();

        // --- Öğretmen ---

        group.MapPost("/", async (
            [FromBody] CreateAssignmentRequest body,
            ICurrentUser current,
            UserDbContext db,
            IPublishEndpoint publish,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            if (body.ContentId == Guid.Empty) return Results.BadRequest("ContentId required");

            var assignment = new Assignment
            {
                TeacherUserId = current.UserId.Value,
                ClassId = body.ClassId,
                ContentId = body.ContentId,
                ContentTitle = body.ContentTitle?.Trim() ?? string.Empty,
                ContentSlug = body.ContentSlug?.Trim(),
                Title = string.IsNullOrWhiteSpace(body.Title) ? (body.ContentTitle?.Trim() ?? "Ödev") : body.Title.Trim(),
                Instructions = body.Instructions?.Trim(),
                DueAtUtc = body.DueAtUtc,
                JoinCode = await GenerateUniqueJoinCodeAsync(db, ct),
            };

            // Hedef öğrencileri çöz: sınıf üyeleri (opsiyonel alt küme) ve/veya explicit öğrenci id'leri.
            var targets = new Dictionary<Guid, string>(); // userId -> email
            var subset = body.StudentUserIds is { Count: > 0 } ? new HashSet<Guid>(body.StudentUserIds) : null;

            if (body.ClassId is { } classId)
            {
                var cls = await db.Classes.Include(c => c.Members)
                    .FirstOrDefaultAsync(c => c.Id == classId && c.TeacherUserId == current.UserId, ct);
                if (cls is null) return Results.BadRequest("Sınıf bulunamadı.");
                foreach (var m in cls.Members)
                {
                    if (subset is null || subset.Contains(m.StudentUserId))
                        targets[m.StudentUserId] = m.StudentEmail;
                }
            }
            else if (subset is not null)
            {
                var profiles = await db.Profiles.AsNoTracking()
                    .Where(p => subset.Contains(p.UserId))
                    .Select(p => new { p.UserId, p.Email })
                    .ToListAsync(ct);
                foreach (var p in profiles) targets[p.UserId] = p.Email;
            }

            foreach (var (uid, email) in targets)
            {
                assignment.Members.Add(new AssignmentMember
                {
                    AssignmentId = assignment.Id,
                    StudentUserId = uid,
                    StudentEmail = email,
                });
            }

            db.Assignments.Add(assignment);
            await db.SaveChangesAsync(ct);

            // Atanan her öğrenciye bildirim.
            foreach (var (uid, email) in targets)
            {
                await publish.Publish(new AssignmentAssignedV1
                {
                    AssignmentId = assignment.Id,
                    StudentUserId = uid,
                    StudentEmail = email,
                    AssignmentTitle = assignment.Title,
                    ContentSlug = assignment.ContentSlug,
                    DueAtUtc = assignment.DueAtUtc,
                }, ct);
            }

            return Results.Created($"/assignments/{assignment.Id}", ToDetail(assignment, assignment.Members));
        });

        group.MapGet("/mine", async (ICurrentUser current, UserDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var rows = await db.Assignments.AsNoTracking()
                .Where(a => a.TeacherUserId == current.UserId)
                .OrderByDescending(a => a.CreatedAtUtc)
                .Select(a => new
                {
                    a.Id, a.ContentId, a.ContentTitle, a.ContentSlug, a.Title, a.Instructions,
                    a.DueAtUtc, a.JoinCode, status = a.Status.ToString(), a.CreatedAtUtc,
                    memberCount = a.Members.Count,
                    completedCount = a.Members.Count(m => m.CompletedAtUtc != null),
                })
                .ToListAsync(ct);
            return Results.Ok(rows);
        });

        group.MapGet("/{id:guid}", async (Guid id, ICurrentUser current, UserDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var assignment = await db.Assignments.AsNoTracking()
                .Include(a => a.Members)
                .FirstOrDefaultAsync(a => a.Id == id && a.TeacherUserId == current.UserId, ct);
            if (assignment is null) return Results.NotFound();
            return Results.Ok(ToDetail(assignment, assignment.Members));
        });

        group.MapPut("/{id:guid}", async (
            Guid id,
            [FromBody] UpdateAssignmentRequest body,
            ICurrentUser current,
            UserDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var assignment = await db.Assignments.FirstOrDefaultAsync(a => a.Id == id && a.TeacherUserId == current.UserId, ct);
            if (assignment is null) return Results.NotFound();
            if (body.Title is not null) assignment.Title = body.Title.Trim();
            if (body.Instructions is not null) assignment.Instructions = body.Instructions.Trim();
            if (body.DueAtUtc is not null) assignment.DueAtUtc = body.DueAtUtc;
            if (body.Status is not null && Enum.TryParse<AssignmentStatus>(body.Status, ignoreCase: true, out var st))
                assignment.Status = st;
            assignment.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        group.MapDelete("/{id:guid}", async (Guid id, ICurrentUser current, UserDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var assignment = await db.Assignments.FirstOrDefaultAsync(a => a.Id == id && a.TeacherUserId == current.UserId, ct);
            if (assignment is null) return Results.NotFound();
            db.Assignments.Remove(assignment);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        // --- Öğrenci ---

        group.MapPost("/join", async (
            [FromBody] JoinAssignmentRequest body,
            ICurrentUser current,
            UserDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var code = body.JoinCode?.Trim().ToUpperInvariant();
            if (string.IsNullOrWhiteSpace(code)) return Results.BadRequest("JoinCode required");

            var assignment = await db.Assignments
                .Include(a => a.Members)
                .FirstOrDefaultAsync(a => a.JoinCode == code, ct);
            if (assignment is null || assignment.Status != AssignmentStatus.Active)
                return Results.NotFound("Geçersiz veya kapalı katılım kodu");

            if (!assignment.Members.Any(m => m.StudentUserId == current.UserId))
            {
                assignment.Members.Add(new AssignmentMember
                {
                    AssignmentId = assignment.Id,
                    StudentUserId = current.UserId.Value,
                    StudentEmail = current.Email ?? string.Empty,
                });
                await db.SaveChangesAsync(ct);
            }

            return Results.Ok(ToStudentView(assignment, current.UserId.Value));
        });

        group.MapGet("/me", async (ICurrentUser current, UserDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var assignments = await db.Assignments.AsNoTracking()
                .Include(a => a.Members.Where(m => m.StudentUserId == current.UserId))
                .Where(a => a.Members.Any(m => m.StudentUserId == current.UserId))
                .OrderByDescending(a => a.CreatedAtUtc)
                .ToListAsync(ct);
            var view = assignments.Select(a => ToStudentView(a, current.UserId!.Value)).ToList();
            return Results.Ok(view);
        });

        return routes;
    }

    private static async Task<string> GenerateUniqueJoinCodeAsync(UserDbContext db, CancellationToken ct)
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var code = RandomCode(6);
            if (!await db.Assignments.AnyAsync(a => a.JoinCode == code, ct))
                return code;
        }
        throw new InvalidOperationException("Benzersiz katılım kodu üretilemedi.");
    }

    private static string RandomCode(int length)
    {
        var chars = new char[length];
        for (var i = 0; i < length; i++)
            chars[i] = JoinCodeAlphabet[RandomNumberGenerator.GetInt32(JoinCodeAlphabet.Length)];
        return new string(chars);
    }

    private static object ToDetail(Assignment a, IEnumerable<AssignmentMember> members) => new
    {
        a.Id, a.ContentId, a.ContentTitle, a.ContentSlug, a.Title, a.Instructions,
        a.DueAtUtc, a.JoinCode, status = a.Status.ToString(), a.CreatedAtUtc,
        members = members.Select(m => new
        {
            m.StudentEmail, m.JoinedAtUtc, m.CompletedAtUtc, m.BestScore,
            completed = m.CompletedAtUtc != null,
        }).ToList(),
    };

    private static object ToStudentView(Assignment a, Guid studentUserId)
    {
        var me = a.Members.FirstOrDefault(m => m.StudentUserId == studentUserId);
        return new
        {
            a.Id, a.ContentId, a.ContentTitle, a.ContentSlug, a.Title, a.Instructions,
            a.DueAtUtc, status = a.Status.ToString(),
            completed = me?.CompletedAtUtc != null,
            completedAtUtc = me?.CompletedAtUtc,
            bestScore = me?.BestScore,
        };
    }
}

public sealed record CreateAssignmentRequest(
    Guid ContentId, string? ContentTitle, string? ContentSlug, string? Title, string? Instructions, DateTime? DueAtUtc,
    Guid? ClassId = null, List<Guid>? StudentUserIds = null);
public sealed record UpdateAssignmentRequest(string? Title, string? Instructions, DateTime? DueAtUtc, string? Status);
public sealed record JoinAssignmentRequest(string JoinCode);
