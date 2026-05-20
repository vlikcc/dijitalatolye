using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;

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
    private static readonly Regex PostgresSchemaNameRegex = new(
        @"^[a-zA-Z_][a-zA-Z0-9_]*$",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);
    public static async Task EnsureSchemaAsync<TContext>(this TContext db, CancellationToken ct = default)
        where TContext : DbContext
    {
        var logger = db.GetService<ILoggerFactory>()
            ?.CreateLogger(typeof(TContext).Name);

        await EnsurePostgresSchemasAsync(db, ct).ConfigureAwait(false);

        var creator = (RelationalDatabaseCreator)db.GetService<IDatabaseCreator>();
        if (!await creator.ExistsAsync(ct).ConfigureAwait(false))
        {
            logger?.LogInformation("Creating database for {Context}", typeof(TContext).Name);
            await creator.CreateAsync(ct).ConfigureAwait(false);
        }

        if (!await ModelTablesMissingAsync(db, ct).ConfigureAwait(false))
        {
            return;
        }

        logger?.LogInformation("Creating missing tables for {Context}", typeof(TContext).Name);
        await creator.CreateTablesAsync(ct).ConfigureAwait(false);

        if (await ModelTablesMissingAsync(db, ct).ConfigureAwait(false))
        {
            throw new InvalidOperationException(
                $"Failed to create database tables for {typeof(TContext).Name}. " +
                "Check Postgres connection string and permissions.");
        }
    }

    private static async Task EnsurePostgresSchemasAsync(DbContext db, CancellationToken ct)
    {
        if (!db.Database.IsRelational()
            || db.Database.ProviderName is not "Npgsql.EntityFrameworkCore.PostgreSQL")
        {
            return;
        }

        var schemas = db.Model.GetEntityTypes()
            .Select(e => e.GetSchema() ?? "public")
            .Where(s => !string.Equals(s, "public", StringComparison.Ordinal))
            .Distinct(StringComparer.Ordinal);

        foreach (var schema in schemas)
        {
            if (!PostgresSchemaNameRegex.IsMatch(schema))
            {
                throw new InvalidOperationException($"Invalid PostgreSQL schema name: {schema}");
            }

#pragma warning disable EF1002, EF1003 // schema adi EF modelinden gelir; PostgresSchemaNameRegex ile dogrulanir
            await db.Database.ExecuteSqlRawAsync(
                "CREATE SCHEMA IF NOT EXISTS \"" + schema + "\"",
                ct).ConfigureAwait(false);
#pragma warning restore EF1002, EF1003
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
                cmd.CommandText = """
                    SELECT EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = @schema
                          AND table_name = @table)
                    """;
                var schemaParam = cmd.CreateParameter();
                schemaParam.ParameterName = "@schema";
                schemaParam.Value = t.Schema;
                cmd.Parameters.Add(schemaParam);
                var tableParam = cmd.CreateParameter();
                tableParam.ParameterName = "@table";
                tableParam.Value = t.Table;
                cmd.Parameters.Add(tableParam);
                var exists = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
                if (exists is null or DBNull || !Convert.ToBoolean(exists))
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
