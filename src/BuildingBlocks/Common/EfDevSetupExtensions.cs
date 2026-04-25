using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;

namespace DijitalAtolye.BuildingBlocks.Common;

/// <summary>
/// Lokal/dev ortamlarda DB veya tablolar yoksa oluşturur.
/// Postgres init script ile yaratılmış boş database varsa EnsureCreated tablo yaratmaz; bu helper o eksikliği kapatır.
/// </summary>
public static class EfDevSetupExtensions
{
    public static async Task EnsureSchemaAsync<TContext>(this TContext db, CancellationToken ct = default)
        where TContext : DbContext
    {
        var creator = (RelationalDatabaseCreator)db.GetService<IDatabaseCreator>();
        if (!await creator.ExistsAsync(ct).ConfigureAwait(false))
        {
            await creator.CreateAsync(ct).ConfigureAwait(false);
            return;
        }
        if (!await creator.HasTablesAsync(ct).ConfigureAwait(false))
        {
            await creator.CreateTablesAsync(ct).ConfigureAwait(false);
        }
    }
}
