using System.Linq.Expressions;
using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.Content.API.Domain;
using DijitalAtolye.Content.API.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Content.API.Consumers;

/// <summary>
/// Submitted'da takılan içerikleri AI moderasyona yeniden gönderir. ContentSubmittedV1 işlenirken
/// AIModeration tarafında istisna olursa (ör. yeniden teslimde rapor çakışması, servis kesintisi) mesaj
/// hata kuyruğuna düşer ve içerik AIModerationCompletedV1 gelmediği için Submitted'da kalırdı.
/// Moderasyon (ContentId, VersionId) başına idempotent olduğundan yeniden göndermek güvenlidir.
/// </summary>
public sealed class StuckModerationRequeuer : BackgroundService
{
    private const int BatchSize = 20;

    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<StuckModerationRequeuer> _logger;
    private readonly TimeSpan _interval;
    private readonly TimeSpan _stuckAfter;
    private readonly int _maxAttempts;

    public StuckModerationRequeuer(IServiceScopeFactory scopes, IConfiguration config, ILogger<StuckModerationRequeuer> logger)
    {
        _scopes = scopes;
        _logger = logger;
        _interval = TimeSpan.FromMinutes(config.GetValue("Moderation:RequeueIntervalMinutes", 10));
        _stuckAfter = TimeSpan.FromMinutes(config.GetValue("Moderation:StuckAfterMinutes", 20));
        _maxAttempts = config.GetValue("Moderation:MaxRequeueAttempts", 5);
    }

    /// <summary>
    /// Yeniden gönderilecek içerik: Submitted, son değişikliği <paramref name="cutoffUtc"/>'den eski ve deneme
    /// sınırı dolmamış. Moderasyon tamamlanınca içerik Submitted'dan çıktığı için tekrar seçilmez.
    /// </summary>
    public static Expression<Func<Domain.Content, bool>> IsStuck(DateTime cutoffUtc, int maxAttempts) =>
        c => c.State == ContentState.Submitted
             && c.UpdatedAtUtc < cutoffUtc
             && c.ModerationRequeueCount < maxAttempts;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Açılışta migration ve bus bağlantısı otursun.
        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RequeueOnceAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Takılan moderasyonları yeniden kuyruğa alma başarısız.");
            }
            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task RequeueOnceAsync(CancellationToken ct)
    {
        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ContentDbContext>();
        var outbox = scope.ServiceProvider.GetRequiredService<IOutboxWriter>();

        var now = DateTime.UtcNow;
        var stuck = await db.Contents
            .Include(c => c.Versions)
            .Where(IsStuck(now - _stuckAfter, _maxAttempts))
            .OrderBy(c => c.UpdatedAtUtc)
            .Take(BatchSize)
            .ToListAsync(ct);
        if (stuck.Count == 0)
            return;

        foreach (var content in stuck)
        {
            var version = content.Versions.FirstOrDefault(v => v.Id == content.CurrentVersionId);
            if (version is null)
                continue;

            await outbox.WriteAsync(ContentSubmittedEventFactory.Create(content, version), ct: ct);
            content.ModerationRequeueCount++;
            content.UpdatedAtUtc = now;
            var level = content.ModerationRequeueCount >= _maxAttempts ? LogLevel.Warning : LogLevel.Information;
            _logger.Log(level, "Takılan içerik AI moderasyona yeniden gönderildi: {ContentId} (deneme {Attempt}/{Max})",
                content.Id, content.ModerationRequeueCount, _maxAttempts);
        }
        await db.SaveChangesAsync(ct);
    }
}
