using System.Security.Cryptography;
using System.Text;
using DijitalAtolye.Analytics.API.Domain;
using DijitalAtolye.Analytics.API.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Analytics.API.Endpoints;

public static class AnalyticsEndpoints
{
    public static IEndpointRouteBuilder MapAnalyticsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/analytics").WithTags("Analytics");

        group.MapPost("/events", async ([FromBody] TrackEventRequest req, AnalyticsDbContext db, HttpContext http, CancellationToken ct) =>
        {
            var ip = http.Connection.RemoteIpAddress?.ToString();
            var ua = http.Request.Headers.UserAgent.ToString();
            var ipHash = ip is null ? null : Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(ip)));

            var evt = new AnalyticsEvent
            {
                ContentId = req.ContentId,
                Type = req.Type,
                DurationSeconds = req.DurationSeconds,
                Source = req.Source,
                AnonymousSessionId = req.SessionId,
                UserAgent = ua,
                IpHash = ipHash,
            };
            db.Events.Add(evt);
            await db.SaveChangesAsync(ct);
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
                    return acc;
                });
            return Results.Ok(new { totals, daily = stats });
        }).RequireAuthorization();

        return app;
    }

    public sealed record TrackEventRequest(
        Guid ContentId,
        AnalyticsEventType Type,
        int? DurationSeconds,
        string? Source,
        string? SessionId);

    public sealed class ContentSummary
    {
        public int Views { get; set; }
        public int Plays { get; set; }
        public int Completes { get; set; }
        public int Likes { get; set; }
        public int Favorites { get; set; }
        public int Shares { get; set; }
        public long TotalDurationSeconds { get; set; }
    }
}
