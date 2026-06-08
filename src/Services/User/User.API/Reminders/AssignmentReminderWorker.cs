using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Assignment;
using DijitalAtolye.User.API.Domain;
using DijitalAtolye.User.API.Persistence;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.User.API.Reminders;

/// <summary>
/// Son tarihi 24 saat içinde olan ve tamamlanmamış ödev üyelerine bir kez hatırlatma gönderir.
/// Dedup: AssignmentMember.ReminderSentAtUtc. AssignmentReminderV1 yayınlar; Notification tüketir.
/// </summary>
public sealed class AssignmentReminderWorker : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(30);
    private static readonly TimeSpan Window = TimeSpan.FromHours(24);
    private static readonly TimeSpan MaxOverdue = TimeSpan.FromDays(7);
    private const int BatchSize = 200;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AssignmentReminderWorker> _logger;

    public AssignmentReminderWorker(IServiceScopeFactory scopeFactory, ILogger<AssignmentReminderWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AssignmentReminderWorker started");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunOnceAsync(stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AssignmentReminderWorker iteration failed");
            }

            try { await Task.Delay(PollInterval, stoppingToken).ConfigureAwait(false); }
            catch (OperationCanceledException) { break; }
        }
    }

    private async Task RunOnceAsync(CancellationToken ct)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<UserDbContext>();
        var publish = scope.ServiceProvider.GetRequiredService<IPublishEndpoint>();

        var now = DateTime.UtcNow;
        var dueBefore = now.Add(Window);
        var notOlderThan = now.Subtract(MaxOverdue);

        // Son tarihi yaklasan/yeni gecmis, tamamlanmamis, henuz hatirlatilmamis uyeler.
        var rows = await db.AssignmentMembers
            .Where(m => m.CompletedAtUtc == null && m.ReminderSentAtUtc == null)
            .Join(
                db.Assignments.Where(a => a.Status == AssignmentStatus.Active
                    && a.DueAtUtc != null && a.DueAtUtc <= dueBefore && a.DueAtUtc >= notOlderThan),
                m => m.AssignmentId,
                a => a.Id,
                (m, a) => new { Member = m, Assignment = a })
            .Take(BatchSize)
            .ToListAsync(ct);

        if (rows.Count == 0) return;

        foreach (var row in rows)
        {
            row.Member.ReminderSentAtUtc = now;
            await publish.Publish(new AssignmentReminderV1
            {
                AssignmentId = row.Assignment.Id,
                StudentUserId = row.Member.StudentUserId,
                StudentEmail = row.Member.StudentEmail,
                AssignmentTitle = row.Assignment.Title,
                ContentSlug = row.Assignment.ContentSlug,
                DueAtUtc = row.Assignment.DueAtUtc,
            }, ct).ConfigureAwait(false);
        }
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
        _logger.LogInformation("AssignmentReminderWorker sent {Count} reminder(s)", rows.Count);
    }
}
