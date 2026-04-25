using DijitalAtolye.BuildingBlocks.Audit;
using DijitalAtolye.BuildingBlocks.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Admin.API.Endpoints;

public static class AuditEndpoints
{
    public static void MapAuditEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/admin/audit").RequireAuthorization(Policies.AdminOnly);

        group.MapGet("/", async (
            AuditDbContext db,
            string? action,
            string? severity,
            Guid? userId,
            DateTime? from,
            DateTime? to,
            int page,
            int pageSize) =>
        {
            page = page <= 0 ? 1 : page;
            pageSize = pageSize <= 0 ? 50 : Math.Min(pageSize, 200);

            var q = db.AuditEntries.AsNoTracking().AsQueryable();
            if (!string.IsNullOrWhiteSpace(action)) q = q.Where(x => x.Action == action);
            if (!string.IsNullOrWhiteSpace(severity)) q = q.Where(x => x.Severity == severity);
            if (userId.HasValue) q = q.Where(x => x.UserId == userId);
            if (from.HasValue) q = q.Where(x => x.OccurredAt >= from.Value);
            if (to.HasValue) q = q.Where(x => x.OccurredAt <= to.Value);

            var total = await q.CountAsync().ConfigureAwait(false);
            var items = await q.OrderByDescending(x => x.OccurredAt)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .ToListAsync().ConfigureAwait(false);

            return Results.Ok(new { total, page, pageSize, items });
        });

        group.MapGet("/summary", async (AuditDbContext db) =>
        {
            var since = DateTime.UtcNow.AddDays(-30);
            var byAction = await db.AuditEntries.AsNoTracking()
                .Where(x => x.OccurredAt >= since)
                .GroupBy(x => x.Action)
                .Select(g => new { action = g.Key, count = g.Count() })
                .OrderByDescending(x => x.count)
                .Take(20)
                .ToListAsync().ConfigureAwait(false);
            var bySeverity = await db.AuditEntries.AsNoTracking()
                .Where(x => x.OccurredAt >= since)
                .GroupBy(x => x.Severity)
                .Select(g => new { severity = g.Key, count = g.Count() })
                .ToListAsync().ConfigureAwait(false);
            return Results.Ok(new { byAction, bySeverity, since });
        });
    }
}
