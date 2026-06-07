using DijitalAtolye.Analytics.API.Domain;
using DijitalAtolye.Analytics.API.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Analytics.API.Aggregation;

/// <summary>
/// Ham <see cref="AnalyticsEvent"/> kayıtlarını periyodik olarak gün bazlı agregatlara (<see cref="ContentDailyStats"/>,
/// <see cref="OutcomeDailyStats"/>) toplar. Her tick'te yalnızca son çalışmadan beri olay almış günleri yeniden
/// hesaplar (o günün satırlarını sil → grupla → yeniden yaz); bu yüzden idempotent ve kendini onaran bir worker'dır.
/// Soğuk başlangıçta checkpoint <see cref="DateTime.MinValue"/> olduğu için tüm geçmiş bir kez backfill edilir.
/// </summary>
public sealed class AnalyticsAggregator : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(60);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AnalyticsAggregator> _logger;

    public AnalyticsAggregator(IServiceScopeFactory scopeFactory, ILogger<AnalyticsAggregator> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AnalyticsAggregator started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await AggregateAsync(stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AnalyticsAggregator iteration failed");
            }

            try
            {
                await Task.Delay(PollInterval, stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task AggregateAsync(CancellationToken ct)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AnalyticsDbContext>();

        var state = await db.AggregationStates.FirstOrDefaultAsync(s => s.Id == 1, ct).ConfigureAwait(false);
        if (state is null)
        {
            state = new AggregationState { Id = 1, LastRunUtc = DateTime.MinValue };
            db.AggregationStates.Add(state);
            await db.SaveChangesAsync(ct).ConfigureAwait(false);
        }

        var runStart = DateTime.UtcNow;
        var since = state.LastRunUtc;

        // Son çalışmadan beri olay almış günler (gün başlangıçları, UTC).
        var affectedDays = await db.Events
            .Where(e => e.OccurredAt >= since)
            .Select(e => e.OccurredAt.Date)
            .Distinct()
            .ToListAsync(ct)
            .ConfigureAwait(false);

        if (affectedDays.Count == 0)
        {
            state.LastRunUtc = runStart;
            await db.SaveChangesAsync(ct).ConfigureAwait(false);
            return;
        }

        foreach (var dayStart in affectedDays)
        {
            var dayEnd = dayStart.AddDays(1);
            var day = DateOnly.FromDateTime(dayStart);

            // O günün mevcut agregatlarını sil; aşağıda yeniden hesaplanacak (idempotent recompute).
            await db.DailyStats.Where(s => s.Day == day).ExecuteDeleteAsync(ct).ConfigureAwait(false);
            await db.OutcomeStats.Where(s => s.Day == day).ExecuteDeleteAsync(ct).ConfigureAwait(false);

            var events = await db.Events
                .Where(e => e.OccurredAt >= dayStart && e.OccurredAt < dayEnd)
                .ToListAsync(ct)
                .ConfigureAwait(false);

            foreach (var grp in events.GroupBy(e => e.ContentId))
            {
                db.DailyStats.Add(new ContentDailyStats
                {
                    ContentId = grp.Key,
                    Day = day,
                    Views = grp.Count(e => e.Type == AnalyticsEventType.View),
                    Plays = grp.Count(e => e.Type == AnalyticsEventType.Play),
                    Completes = grp.Count(e => e.Type == AnalyticsEventType.Complete),
                    Likes = grp.Count(e => e.Type == AnalyticsEventType.Like),
                    Favorites = grp.Count(e => e.Type == AnalyticsEventType.Favorite),
                    Shares = grp.Count(e => e.Type == AnalyticsEventType.Share),
                    TotalDurationSeconds = grp.Sum(e => (long)(e.DurationSeconds ?? 0)),
                    ScoreSum = grp.Where(e => e.Score.HasValue).Sum(e => (long)e.Score!.Value),
                    ScoreCount = grp.Count(e => e.Score.HasValue),
                });
            }

            foreach (var grp in events
                         .Where(e => !string.IsNullOrEmpty(e.OutcomeCode))
                         .GroupBy(e => new { e.ContentId, OutcomeCode = e.OutcomeCode! }))
            {
                db.OutcomeStats.Add(new OutcomeDailyStats
                {
                    ContentId = grp.Key.ContentId,
                    OutcomeCode = grp.Key.OutcomeCode,
                    Day = day,
                    Completes = grp.Count(e => e.Type == AnalyticsEventType.Complete),
                    Progresses = grp.Count(e => e.Type == AnalyticsEventType.Progress),
                    ScoreSum = grp.Where(e => e.Score.HasValue).Sum(e => (long)e.Score!.Value),
                    ScoreCount = grp.Count(e => e.Score.HasValue),
                });
            }

            await db.SaveChangesAsync(ct).ConfigureAwait(false);
        }

        state.LastRunUtc = runStart;
        await db.SaveChangesAsync(ct).ConfigureAwait(false);

        _logger.LogInformation("AnalyticsAggregator processed {DayCount} day(s)", affectedDays.Count);
    }
}
