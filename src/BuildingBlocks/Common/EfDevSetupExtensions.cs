using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;

namespace DijitalAtolye.BuildingBlocks.Common;

/// <summary>
/// Lokal/dev ortamlarda DB veya tablolar yoksa oluşturur.
/// Postgres init script ile yaratılmış boş database varsa EnsureCreated tablo yaratmaz; bu helper o eksikliği kapatır.
/// </summary>
/// <remarks>
/// EF'in <see cref="RelationalDatabaseCreator.HasTablesAsync"/> metodu <c>__EFMigrationsHistory</c> dahil
/// her tabloyu sayar. Eğer eski bir migration kalıntısı varsa tabloları "var" kabul edip
/// <c>CreateTablesAsync</c>'i atlardı. Bu sürüm, gerçek model tablolarına göre kontrol eder.
/// </remarks>
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

        if (await ModelTablesMissingAsync(db, ct).ConfigureAwait(false))
        {
            await creator.CreateTablesAsync(ct).ConfigureAwait(false);
        }
    }

    private static async Task<bool> ModelTablesMissingAsync(DbContext db, CancellationToken ct)
    {
        var modelEntities = db.Model.GetEntityTypes()
            .Where(e => !e.IsOwned())
            .Select(e => new
            {
                Schema = e.GetSchema() ?? "public",
                Table = e.GetTableName(),
            })
            .Where(x => !string.IsNullOrEmpty(x.Table))
            .Distinct()
            .ToList();

        if (modelEntities.Count == 0) return false;

        var conn = db.Database.GetDbConnection();
        var opened = false;
        if (conn.State != System.Data.ConnectionState.Open)
        {
            await conn.OpenAsync(ct).ConfigureAwait(false);
            opened = true;
        }
        try
        {
            foreach (var t in modelEntities)
            {
                using var cmd = conn.CreateCommand();
                // Npgsql 8+: to_regclass() dönüş tipi regclass; ExecuteScalar ile object okunamaz — ::text ile stringe çevir.
                cmd.CommandText = "SELECT to_regclass(@qname)::text";
                var p = cmd.CreateParameter();
                p.ParameterName = "@qname";
                p.Value = $"\"{t.Schema}\".\"{t.Table}\"";
                cmd.Parameters.Add(p);
                var result = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
                if (result is null || result is DBNull || string.IsNullOrEmpty(Convert.ToString(result)))
                {
                    return true;
                }
            }
            return false;
        }
        finally
        {
            if (opened) await conn.CloseAsync().ConfigureAwait(false);
        }
    }
}
