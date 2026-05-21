using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.Catalog.API.Domain;
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

        // İsim/sınıf numarasıyla filtreli düz kazanım listesi (AI metadata extraction için).
        // subject: Subject.Code veya Subject.Name (case-insensitive). grade: Grade.Id (1-12).
        // Hiçbir parametre verilmezse tüm kazanımları döner (üst sınır ile).
        catalog.MapGet("/outcomes", async (
            [FromQuery] string? subject,
            [FromQuery] int? grade,
            [FromQuery] int? limit,
            CatalogDbContext db,
            CancellationToken ct) =>
        {
            var max = Math.Clamp(limit ?? 200, 1, 500);

            var unitsQuery = db.Units.AsNoTracking().AsQueryable();
            if (grade is not null)
            {
                unitsQuery = unitsQuery.Where(u => u.GradeId == grade.Value);
            }
            if (!string.IsNullOrWhiteSpace(subject))
            {
                var s = subject.Trim();
                var subjectIds = await db.Subjects.AsNoTracking()
                    .Where(x => EF.Functions.ILike(x.Code, s) || EF.Functions.ILike(x.Name, s))
                    .Select(x => x.Id)
                    .ToListAsync(ct);
                if (subjectIds.Count == 0) return Results.Ok(Array.Empty<object>());
                unitsQuery = unitsQuery.Where(u => subjectIds.Contains(u.SubjectId));
            }

            var unitIds = await unitsQuery.Select(u => u.Id).ToListAsync(ct);
            if (unitIds.Count == 0) return Results.Ok(Array.Empty<object>());

            var outcomes = await db.Outcomes.AsNoTracking()
                .Where(o => unitIds.Contains(o.UnitId))
                .OrderBy(o => o.Code)
                .Take(max)
                .Select(o => new { o.Code, o.Description })
                .ToListAsync(ct);

            return Results.Ok(outcomes);
        });

        // Cascading: subject → outcomes (Faz F)
        catalog.MapGet("/subjects/{subjectId:guid}/outcomes", async (
            Guid subjectId,
            [FromQuery] int? gradeId,
            CatalogDbContext db,
            CancellationToken ct) =>
        {
            var query = db.Units.AsNoTracking()
                .Where(u => u.SubjectId == subjectId);
            if (gradeId is not null)
                query = query.Where(u => u.GradeId == gradeId);

            var unitIds = await query.Select(u => u.Id).ToListAsync(ct);
            var outcomes = await db.Outcomes.AsNoTracking()
                .Where(o => unitIds.Contains(o.UnitId))
                .OrderBy(o => o.Code)
                .Select(o => new { o.Id, o.Code, o.Description, o.UnitId })
                .ToListAsync(ct);

            return Results.Ok(outcomes);
        });

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

        // MEB JSON import (Faz F)
        catalog.MapPost("/admin/import-meb", async (
            [FromBody] MebImportPayload payload,
            CatalogDbContext db,
            IDistributedCache cache,
            CancellationToken ct) =>
        {
            var imported = new { grades = 0, subjects = 0, units = 0, outcomes = 0 };
            var counters = new int[4]; // grades, subjects, units, outcomes

            foreach (var gradeDto in payload.Grades)
            {
                var grade = await db.Grades.FirstOrDefaultAsync(g => g.Id == gradeDto.Id, ct);
                if (grade is null)
                {
                    grade = new Grade { Id = gradeDto.Id, Name = gradeDto.Name, Code = gradeDto.Name.Replace(" ", "").ToLowerInvariant() };
                    db.Grades.Add(grade);
                    counters[0]++;
                }

                foreach (var subjectDto in gradeDto.Subjects)
                {
                    var subject = await db.Subjects.FirstOrDefaultAsync(s => s.Name == subjectDto.Name, ct);
                    if (subject is null)
                    {
                        subject = new Subject { Name = subjectDto.Name, Code = subjectDto.Name.Replace(" ", "").ToLowerInvariant() };
                        db.Subjects.Add(subject);
                        await db.SaveChangesAsync(ct); // Id resolve
                        counters[1]++;
                    }

                    var order = 0;
                    foreach (var unitDto in subjectDto.Units)
                    {
                        order++;
                        var unit = await db.Units.FirstOrDefaultAsync(
                            u => u.SubjectId == subject.Id && u.GradeId == grade.Id && u.Name == unitDto.Name, ct);
                        if (unit is null)
                        {
                            unit = new Unit
                            {
                                SubjectId = subject.Id,
                                GradeId = grade.Id,
                                Name = unitDto.Name,
                                Order = order,
                            };
                            db.Units.Add(unit);
                            await db.SaveChangesAsync(ct);
                            counters[2]++;
                        }

                        foreach (var outcomeDto in unitDto.Outcomes)
                        {
                            var existingOutcome = await db.Outcomes.FirstOrDefaultAsync(o => o.Code == outcomeDto.Code, ct);
                            if (existingOutcome is null)
                            {
                                db.Outcomes.Add(new Outcome
                                {
                                    UnitId = unit.Id,
                                    Code = outcomeDto.Code,
                                    Description = outcomeDto.Description,
                                });
                                counters[3]++;
                            }
                        }
                    }
                }
            }

            await db.SaveChangesAsync(ct);
            // Cache temizle
            await cache.RemoveAsync(OutcomeTreeCacheKey, ct);

            return Results.Ok(new
            {
                message = "MEB müfredat verisi başarıyla içe aktarıldı.",
                importedGrades = counters[0],
                importedSubjects = counters[1],
                importedUnits = counters[2],
                importedOutcomes = counters[3],
            });
        }).RequireAuthorization(Policies.AdminOnly);

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

// MEB JSON import DTO'ları
public sealed record MebImportPayload(MebGradeDto[] Grades);
public sealed record MebGradeDto(int Id, string Name, MebSubjectDto[] Subjects);
public sealed record MebSubjectDto(string Name, MebUnitDto[] Units);
public sealed record MebUnitDto(string Name, MebOutcomeDto[] Outcomes);
public sealed record MebOutcomeDto(string Code, string Description);

