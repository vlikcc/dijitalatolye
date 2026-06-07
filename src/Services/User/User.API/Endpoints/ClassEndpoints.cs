using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.User.API.Domain;
using DijitalAtolye.User.API.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.User.API.Endpoints;

public static class ClassEndpoints
{
    public static IEndpointRouteBuilder MapClassEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/classes").WithTags("Classes").RequireAuthorization(Policies.TeacherOrAbove);

        group.MapPost("/", async (
            [FromBody] CreateClassRequest body,
            ICurrentUser current,
            UserDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(body.Name)) return Results.BadRequest("Name required");
            var cls = new SchoolClass { TeacherUserId = current.UserId.Value, Name = body.Name.Trim() };
            db.Classes.Add(cls);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/classes/{cls.Id}", ToDetail(cls, []));
        });

        group.MapGet("/mine", async (ICurrentUser current, UserDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var rows = await db.Classes.AsNoTracking()
                .Where(c => c.TeacherUserId == current.UserId)
                .OrderByDescending(c => c.CreatedAtUtc)
                .Select(c => new { c.Id, c.Name, c.CreatedAtUtc, memberCount = c.Members.Count })
                .ToListAsync(ct);
            return Results.Ok(rows);
        });

        group.MapGet("/{id:guid}", async (Guid id, ICurrentUser current, UserDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var cls = await db.Classes.AsNoTracking()
                .Include(c => c.Members)
                .FirstOrDefaultAsync(c => c.Id == id && c.TeacherUserId == current.UserId, ct);
            return cls is null ? Results.NotFound() : Results.Ok(ToDetail(cls, cls.Members));
        });

        group.MapPut("/{id:guid}", async (
            Guid id,
            [FromBody] UpdateClassRequest body,
            ICurrentUser current,
            UserDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var cls = await db.Classes.FirstOrDefaultAsync(c => c.Id == id && c.TeacherUserId == current.UserId, ct);
            if (cls is null) return Results.NotFound();
            if (!string.IsNullOrWhiteSpace(body.Name)) cls.Name = body.Name.Trim();
            cls.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        group.MapDelete("/{id:guid}", async (Guid id, ICurrentUser current, UserDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var cls = await db.Classes.FirstOrDefaultAsync(c => c.Id == id && c.TeacherUserId == current.UserId, ct);
            if (cls is null) return Results.NotFound();
            db.Classes.Remove(cls);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        group.MapPost("/{id:guid}/members", async (
            Guid id,
            [FromBody] AddClassMembersRequest body,
            ICurrentUser current,
            UserDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var cls = await db.Classes.Include(c => c.Members)
                .FirstOrDefaultAsync(c => c.Id == id && c.TeacherUserId == current.UserId, ct);
            if (cls is null) return Results.NotFound();

            var added = 0;
            foreach (var s in body.Students ?? [])
            {
                if (s.UserId == Guid.Empty) continue;
                if (cls.Members.Any(m => m.StudentUserId == s.UserId)) continue;
                cls.Members.Add(new ClassMember
                {
                    ClassId = cls.Id,
                    StudentUserId = s.UserId,
                    StudentEmail = s.Email ?? string.Empty,
                });
                added++;
            }
            cls.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Ok(ToDetail(cls, cls.Members));
        });

        group.MapDelete("/{id:guid}/members/{studentUserId:guid}", async (
            Guid id,
            Guid studentUserId,
            ICurrentUser current,
            UserDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var cls = await db.Classes.FirstOrDefaultAsync(c => c.Id == id && c.TeacherUserId == current.UserId, ct);
            if (cls is null) return Results.NotFound();
            var member = await db.ClassMembers.FirstOrDefaultAsync(m => m.ClassId == id && m.StudentUserId == studentUserId, ct);
            if (member is null) return Results.NotFound();
            db.ClassMembers.Remove(member);
            cls.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        return routes;
    }

    private static object ToDetail(SchoolClass c, IEnumerable<ClassMember> members) => new
    {
        c.Id, c.Name, c.CreatedAtUtc,
        members = members
            .OrderBy(m => m.StudentEmail)
            .Select(m => new { m.StudentUserId, m.StudentEmail, m.AddedAtUtc })
            .ToList(),
    };
}

public sealed record CreateClassRequest(string Name);
public sealed record UpdateClassRequest(string? Name);
public sealed record AddClassMembersRequest(List<ClassMemberInput> Students);
public sealed record ClassMemberInput(Guid UserId, string? Email);
