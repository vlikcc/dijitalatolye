using System.Text.Json;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace DijitalAtolye.BuildingBlocks.Outbox;

/// <summary>
/// Outbox tablosundaki "henüz publish edilmemiş" mesajları periyodik olarak broker'a gönderir.
/// Production'da MassTransit'in EF Core outbox'ını da kullanmak mümkün; bu sınıf basit bir
/// fallback / tanı amaçlı dispatcher sağlar.
/// </summary>
public sealed class OutboxDispatcher<TDbContext> : BackgroundService where TDbContext : DbContext
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(5);
    private const int BatchSize = 100;
    private static readonly JsonSerializerOptions _serializerOptions = new(JsonSerializerDefaults.Web);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OutboxDispatcher<TDbContext>> _logger;

    public OutboxDispatcher(IServiceScopeFactory scopeFactory, ILogger<OutboxDispatcher<TDbContext>> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OutboxDispatcher started for {Context}", typeof(TDbContext).Name);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DispatchBatchAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "OutboxDispatcher iteration failed");
            }

            await Task.Delay(PollInterval, stoppingToken);
        }
    }

    private async Task DispatchBatchAsync(CancellationToken ct)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<TDbContext>();
        var publishEndpoint = scope.ServiceProvider.GetRequiredService<IPublishEndpoint>();

        var pending = await dbContext.Set<OutboxMessage>()
            .Where(m => m.ProcessedAt == null && m.RetryCount < 10)
            .OrderBy(m => m.OccurredOn)
            .Take(BatchSize)
            .ToListAsync(ct);

        if (pending.Count == 0)
        {
            return;
        }

        foreach (var message in pending)
        {
            try
            {
                var type = ResolveType(message.EventType);
                if (type is null)
                {
                    message.Error = $"Type not found: {message.EventType}";
                    message.RetryCount = 10;
                    continue;
                }

                var payload = JsonSerializer.Deserialize(message.Payload, type, _serializerOptions)
                    ?? throw new InvalidOperationException("Deserialized payload is null.");

                await publishEndpoint.Publish(payload, type, ct);
                message.ProcessedAt = DateTime.UtcNow;
                message.Error = null;
            }
            catch (Exception ex)
            {
                message.RetryCount++;
                message.Error = ex.Message;
                _logger.LogWarning(ex, "Outbox message {MessageId} dispatch failed (retry {Retry})",
                    message.Id, message.RetryCount);
            }
        }

        await dbContext.SaveChangesAsync(ct);
        _logger.LogDebug("Dispatched {Count} outbox messages", pending.Count(m => m.ProcessedAt != null));
    }

    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, Type?> _typeCache = new();
    private static Type? ResolveType(string fullName)
    {
        return _typeCache.GetOrAdd(fullName, key =>
        {
            var direct = Type.GetType(key);
            if (direct is not null) return direct;
            foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
            {
                try
                {
                    var t = asm.GetType(key, throwOnError: false, ignoreCase: false);
                    if (t is not null) return t;
                }
                catch { /* dynamic asm vs */ }
            }
            return null;
        });
    }
}
