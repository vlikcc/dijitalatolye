using System.Security.Cryptography;
using System.Text;
using DijitalAtolye.Analytics.API.Domain;
using DijitalAtolye.Analytics.API.Persistence;
using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Analytics;
using MassTransit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Analytics.API.Endpoints;

public static class AnalyticsEndpoints
{
    public static IEndpointRouteBuilder MapAnalyticsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/analytics").WithTags("Analytics");

        group.MapPost("/events", async ([FromBody] TrackEventRequest req, AnalyticsDbContext db, ICurrentUser currentUser, IPublishEndpoint publish, HttpContext http, CancellationToken ct) =>
        {
            var ip = http.Connection.RemoteIpAddress?.ToString();
            var ua = http.Request.Headers.UserAgent.ToString();
            var ipHash = ip is null ? null : Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(ip)));

            // Skoru 0–100 aralığına kıs; kazanım kodunu trim + 32 karaktere sınırla (içerikten gelen güvenilmeyen veri).
            var score = req.Score is { } s ? Math.Clamp(s, 0, 100) : (int?)null;
            var outcomeCode = string.IsNullOrWhiteSpace(req.OutcomeCode)
                ? null
                : req.OutcomeCode.Trim() is { Length: > 32 } trimmed ? trimmed[..32] : req.OutcomeCode.Trim();

            var evt = new AnalyticsEvent
            {
                ContentId = req.ContentId,
                UserId = currentUser.UserId,
                Type = req.Type,
                DurationSeconds = req.DurationSeconds,
                Score = score,
                OutcomeCode = outcomeCode,
                Source = req.Source,
                AnonymousSessionId = req.SessionId,
                UserAgent = ua,
                IpHash = ipHash,
            };
            db.Events.Add(evt);
            await db.SaveChangesAsync(ct);
            DijitalAtolye.BuildingBlocks.WebHostExtensions.DomainMetrics.AnalyticsEvent.Add(1);

            // Giriş yapmış kullanıcının tamamlaması, ödev tamamlanmasını işaretlemek için yayınlanır.
            if (evt.Type == AnalyticsEventType.Complete && evt.UserId is { } uid)
            {
                await publish.Publish(new ContentCompletedV1
                {
                    ContentId = evt.ContentId,
                    UserId = uid,
                    Score = evt.Score,
                    CompletedAt = evt.OccurredAt,
                }, ct);
            }

            return Results.Accepted();
        });

        group.MapGet("/contents/{id:guid}/summary", async (Guid id, AnalyticsDbContext db, CancellationToken ct) =>
        {
            var stats = await db.DailyStats
                .Where(s => s.ContentId == id)
                .OrderByDescending(s => s.Day)
                .Take(30)
                .ToListAsync(ct);
            var totals = stats.Aggregate(new ContentSummary(),
                (acc, s) =>
                {
                    acc.Views += s.Views;
                    acc.Plays += s.Plays;
                    acc.Completes += s.Completes;
                    acc.Likes += s.Likes;
                    acc.Favorites += s.Favorites;
                    acc.Shares += s.Shares;
                    acc.TotalDurationSeconds += s.TotalDurationSeconds;
                    acc.ScoreSum += s.ScoreSum;
                    acc.ScoreCount += s.ScoreCount;
                    return acc;
                });
            return Results.Ok(new { totals, avgScore = totals.AvgScore, daily = stats });
        }).RequireAuthorization(Policies.TeacherOrAbove);

        // Kazanım (MEB outcome) bazlı rollup — kazanım-bazlı ilerleme panellerinin veri temeli.
        group.MapGet("/contents/{id:guid}/outcomes", async (Guid id, AnalyticsDbContext db, CancellationToken ct) =>
        {
            var rows = await db.OutcomeStats
                .Where(s => s.ContentId == id)
                .ToListAsync(ct);
            var outcomes = rows
                .GroupBy(s => s.OutcomeCode)
                .Select(g =>
                {
                    var scoreCount = g.Sum(s => s.ScoreCount);
                    var scoreSum = g.Sum(s => s.ScoreSum);
                    return new
                    {
                        outcomeCode = g.Key,
                        completes = g.Sum(s => s.Completes),
                        progresses = g.Sum(s => s.Progresses),
                        avgScore = scoreCount > 0 ? Math.Round((double)scoreSum / scoreCount, 1) : (double?)null,
                    };
                })
                .OrderBy(o => o.outcomeCode)
                .ToList();
            return Results.Ok(new { outcomes });
        }).RequireAuthorization(Policies.TeacherOrAbove);

        // Giriş yapan öğrencinin kendi kazanım ilerlemesi. Kullanıcı-bazlı veri agregatlanmadığı için
        // ham events tablosundan doğrudan hesaplanır (bu ölçekte yeterli).
        group.MapGet("/me/progress", async (AnalyticsDbContext db, ICurrentUser currentUser, CancellationToken ct) =>
        {
            var userId = currentUser.UserId;
            if (userId is null)
            {
                return Results.Ok(new { totals = new MyProgressTotals(), outcomes = Array.Empty<object>() });
            }

            var events = await db.Events
                .Where(e => e.UserId == userId)
                .Select(e => new { e.ContentId, e.OutcomeCode, e.Type, e.Score, e.OccurredAt })
                .ToListAsync(ct);

            var totals = new MyProgressTotals
            {
                PlayedContents = events.Select(e => e.ContentId).Distinct().Count(),
                TotalCompletes = events.Count(e => e.Type == AnalyticsEventType.Complete),
                ScoreSum = events.Where(e => e.Score.HasValue).Sum(e => (long)e.Score!.Value),
                ScoreCount = events.Count(e => e.Score.HasValue),
            };

            var outcomes = events
                .Where(e => !string.IsNullOrEmpty(e.OutcomeCode))
                .GroupBy(e => e.OutcomeCode!)
                .Select(g =>
                {
                    var scoreCount = g.Count(e => e.Score.HasValue);
                    var scoreSum = g.Where(e => e.Score.HasValue).Sum(e => (long)e.Score!.Value);
                    return new
                    {
                        outcomeCode = g.Key,
                        completes = g.Count(e => e.Type == AnalyticsEventType.Complete),
                        progresses = g.Count(e => e.Type == AnalyticsEventType.Progress),
                        avgScore = scoreCount > 0 ? Math.Round((double)scoreSum / scoreCount, 1) : (double?)null,
                        lastActivityUtc = g.Max(e => e.OccurredAt),
                    };
                })
                .OrderBy(o => o.outcomeCode)
                .ToList();

            return Results.Ok(new { totals, overallAvgScore = totals.OverallAvgScore, outcomes });
        }).RequireAuthorization();

        group.MapGet("/admin/stats", async (AnalyticsDbContext db, CancellationToken ct) =>
        {
            var totalPlays = await db.Events.CountAsync(e => e.Type == AnalyticsEventType.Play, ct);
            var last30 = DateTime.UtcNow.AddDays(-30);
            var activeUsers = await db.Events
                .Where(e => e.OccurredAt >= last30 && e.UserId != null)
                .Select(e => e.UserId)
                .Distinct()
                .CountAsync(ct);
            return Results.Ok(new { totalPlays, activeUsersLast30Days = activeUsers });
        }).RequireAuthorization(Policies.AdminOnly);

        return app;
    }

    public sealed record TrackEventRequest(
        Guid ContentId,
        AnalyticsEventType Type,
        int? DurationSeconds,
        string? Source,
        string? SessionId,
        int? Score = null,
        string? OutcomeCode = null);

    public sealed class ContentSummary
    {
        public int Views { get; set; }
        public int Plays { get; set; }
        public int Completes { get; set; }
        public int Likes { get; set; }
        public int Favorites { get; set; }
        public int Shares { get; set; }
        public long TotalDurationSeconds { get; set; }
        public long ScoreSum { get; set; }
        public int ScoreCount { get; set; }
        /// <summary>Skoru olan olayların ortalaması (0–100); hiç skor yoksa null.</summary>
        public double? AvgScore => ScoreCount > 0 ? Math.Round((double)ScoreSum / ScoreCount, 1) : null;
    }

    public sealed class MyProgressTotals
    {
        public int PlayedContents { get; set; }
        public int TotalCompletes { get; set; }
        public long ScoreSum { get; set; }
        public int ScoreCount { get; set; }
        public double? OverallAvgScore => ScoreCount > 0 ? Math.Round((double)ScoreSum / ScoreCount, 1) : null;
    }
}
