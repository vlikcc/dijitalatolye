using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.Catalog.API.Domain;
using DijitalAtolye.Catalog.API.Import;
using DijitalAtolye.Catalog.API.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace DijitalAtolye.Catalog.API.Endpoints;

public static class CatalogEndpoints
{
    private const string OutcomeTreeCacheKey = "catalog:outcome-tree:v1";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(15);

    public static IEndpointRouteBuilder MapCatalogEndpoints(this IEndpointRouteBuilder routes)
    {
        var catalog = routes.MapGroup("/catalog").WithTags("Catalog");

        catalog.MapGet("/grades", async (CatalogDbContext db, CancellationToken ct) =>
            await db.Grades.AsNoTracking().OrderBy(g => g.Id).ToListAsync(ct));

        catalog.MapGet("/subjects", async (CatalogDbContext db, CancellationToken ct) =>
            await db.Subjects.AsNoTracking().OrderBy(s => s.Name).ToListAsync(ct));

        catalog.MapGet("/categories", async (CatalogDbContext db, CancellationToken ct) =>
            await db.Categories.AsNoTracking().OrderBy(c => c.Name).ToListAsync(ct));

        catalog.MapGet("/outcomes/tree", async (
            [FromQuery] int? gradeId,
            [FromQuery] Guid? subjectId,
            CatalogDbContext db,
            IDistributedCache cache,
            CancellationToken ct) =>
        {
            if (gradeId is null && subjectId is null)
            {
                var cached = await cache.GetStringAsync(OutcomeTreeCacheKey, ct);
                if (cached is not null)
                {
                    return Results.Content(cached, "application/json");
                }
            }

            var query = from u in db.Units.AsNoTracking()
                        join s in db.Subjects.AsNoTracking() on u.SubjectId equals s.Id
                        join g in db.Grades.AsNoTracking() on u.GradeId equals g.Id
                        select new { u, s, g };

            if (gradeId is not null) query = query.Where(x => x.g.Id == gradeId);
            if (subjectId is not null) query = query.Where(x => x.s.Id == subjectId);

            var units = await query.OrderBy(x => x.g.Id).ThenBy(x => x.s.Name).ThenBy(x => x.u.Order)
                .ToListAsync(ct);

            var unitIds = units.Select(x => x.u.Id).ToArray();
            var outcomes = await db.Outcomes.AsNoTracking()
                .Where(o => unitIds.Contains(o.UnitId)).ToListAsync(ct);

            var tree = units.GroupBy(x => x.g)
                .Select(gradeGroup => new
                {
                    Grade = gradeGroup.Key,
                    Subjects = gradeGroup.GroupBy(x => x.s).Select(subjectGroup => new
                    {
                        Subject = subjectGroup.Key,
                        Units = subjectGroup.Select(x => new
                        {
                            x.u.Id,
                            x.u.Name,
                            x.u.Order,
                            Outcomes = outcomes.Where(o => o.UnitId == x.u.Id)
                                .Select(o => new { o.Id, o.Code, o.Description }),
                        }),
                    }),
                })
                .ToList();

            var json = JsonSerializer.Serialize(tree);
            if (gradeId is null && subjectId is null)
            {
                await cache.SetStringAsync(OutcomeTreeCacheKey, json,
                    new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = CacheTtl }, ct);
            }
            return Results.Content(json, "application/json");
        });

        catalog.MapGet("/tags", async (
            [FromQuery] string? status,
            [FromQuery] string? search,
            CatalogDbContext db,
            CancellationToken ct) =>
        {
            var query = db.Tags.AsNoTracking().AsQueryable();
            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<TagStatus>(status, true, out var st))
                query = query.Where(t => t.Status == st);
            else
                query = query.Where(t => t.Status == TagStatus.Approved);
            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(t => EF.Functions.ILike(t.DisplayName, $"%{search}%"));
            return await query.OrderByDescending(t => t.UsageCount).Take(100).ToListAsync(ct);
        });

        catalog.MapGet("/subjects/{id:guid}/outcomes", async (
            Guid id,
            [FromQuery] int? gradeId,
            CatalogDbContext db,
            CancellationToken ct) =>
        {
            var subject = await db.Subjects.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id, ct);
            if (subject is null) return Results.NotFound();

            var unitsQuery = db.Units.AsNoTracking().Where(u => u.SubjectId == id);
            if (gradeId is not null) unitsQuery = unitsQuery.Where(u => u.GradeId == gradeId);
            var units = await unitsQuery.OrderBy(u => u.GradeId).ThenBy(u => u.Order).ToListAsync(ct);
            var unitIds = units.Select(u => u.Id).ToArray();
            var outcomes = await db.Outcomes.AsNoTracking()
                .Where(o => unitIds.Contains(o.UnitId))
                .OrderBy(o => o.Code)
                .ToListAsync(ct);

            var grades = await db.Grades.AsNoTracking()
                .Where(g => units.Select(u => u.GradeId).Distinct().Contains(g.Id))
                .OrderBy(g => g.Id)
                .ToListAsync(ct);

            return Results.Ok(new
            {
                subject,
                grades = grades.Select(g => new
                {
                    grade = g,
                    units = units.Where(u => u.GradeId == g.Id).Select(u => new
                    {
                        u.Id,
                        u.Name,
                        u.Order,
                        outcomes = outcomes.Where(o => o.UnitId == u.Id),
                    }),
                }),
            });
        });

        catalog.MapPost("/admin/import-meb-json", async (
            [FromBody] MebImportRow[] rows,
            MebCatalogImporter importer,
            IDistributedCache cache,
            CancellationToken ct) =>
        {
            if (rows.Length == 0) return Results.BadRequest("Empty payload");
            var result = await importer.ImportAsync(rows, ct);
            await cache.RemoveAsync(OutcomeTreeCacheKey, ct);
            return Results.Ok(result);
        }).RequireAuthorization(Policies.AdminOnly);

        catalog.MapPost("/tags", async (
            [FromBody] CreateTagRequest body,
            ICurrentUser current,
            CatalogDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var slug = Slugify(body.DisplayName);
            var existing = await db.Tags.FirstOrDefaultAsync(t => t.Slug == slug, ct);
            if (existing is not null)
            {
                existing.UsageCount++;
                await db.SaveChangesAsync(ct);
                return Results.Ok(existing);
            }
            var tag = new Tag
            {
                Slug = slug,
                DisplayName = body.DisplayName.Trim(),
                Status = TagStatus.Pending,
                CreatedByUserId = current.UserId,
                UsageCount = 1,
            };
            db.Tags.Add(tag);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/catalog/tags/{tag.Id}", tag);
        }).RequireAuthorization(Policies.TeacherOrAbove);

        return routes;
    }

    private static string Slugify(string s)
    {
        var normalized = s.Trim().ToLowerInvariant()
            .Replace("ç", "c").Replace("ğ", "g").Replace("ı", "i")
            .Replace("ö", "o").Replace("ş", "s").Replace("ü", "u");
        var sb = new System.Text.StringBuilder(normalized.Length);
        foreach (var c in normalized)
        {
            if (char.IsLetterOrDigit(c)) sb.Append(c);
            else if (c is ' ' or '-' or '_' && (sb.Length == 0 || sb[^1] != '-')) sb.Append('-');
        }
        return sb.ToString().Trim('-');
    }
}

public sealed record CreateTagRequest(string DisplayName);
