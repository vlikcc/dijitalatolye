using DijitalAtolye.BuildingBlocks.EventBus.Events;
using DijitalAtolye.BuildingBlocks.Outbox;

namespace DijitalAtolye.Identity.Infrastructure.Persistence;

/// <summary>
/// Identity'de UserManager her çağrıda kendi SaveChanges'ını yapar; ortak bir unit-of-work yoktur.
/// Bu yüzden outbox kaydı yazıldığı anda kalıcılaştırılır — aksi halde (ör. resend-verification)
/// mesaj DbContext'te kalır ve hiç yayınlanmaz.
/// </summary>
internal sealed class AutoSavingOutboxWriter : IOutboxWriter
{
    private readonly IdentityDbContext _db;
    private readonly EfCoreOutboxWriter<IdentityDbContext> _inner;

    public AutoSavingOutboxWriter(IdentityDbContext db)
    {
        _db = db;
        _inner = new EfCoreOutboxWriter<IdentityDbContext>(db);
    }

    public async Task WriteAsync<TEvent>(TEvent integrationEvent, Guid? correlationId = null, CancellationToken ct = default)
        where TEvent : class, IIntegrationEvent
    {
        await _inner.WriteAsync(integrationEvent, correlationId, ct);
        await _db.SaveChangesAsync(ct);
    }
}
