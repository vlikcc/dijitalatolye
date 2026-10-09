using System.Data;
using System.Data.Common;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;

namespace DijitalAtolye.BuildingBlocks.Common;

/// <summary>
/// Servis açılışında EF Core migration'larını uygular; eski <c>EnsureCreated</c>/<c>EnsureSchemaAsync</c>
/// ile kurulmuş (migration geçmişi olmayan) veritabanlarını güvenle "baseline"lar.
/// </summary>
/// <remarks>
/// Akış:
/// <list type="number">
/// <item>Veritabanı yoksa oluşturulur; ardından context tipine özgü bir Postgres advisory lock alınır
/// (aynı DB'ye bağlanan replikalar/servisler sırayla çalışır).</item>
/// <item>Uygulanmış migration yoksa ve ilk migration'ın (InitialCreate) tablolarından en az biri zaten varsa
/// DB "legacy" kabul edilir: tek transaction içinde şemalar garanti edilir, servise özgü
/// <c>upgradeLegacySchema</c> SQL'i çalışır, InitialCreate'te olup DB'de olmayan tablo/index'ler
/// InitialCreate'in kendi DDL'iyle yaratılır, kolonlar doğrulanır ve history tablosuna InitialCreate satırı
/// yazılır. Böylece <c>MigrateAsync</c> InitialCreate'i atlar, sonraki migration'ları normal uygular.</item>
/// <item><see cref="RelationalDatabaseFacadeExtensions.MigrateAsync(DatabaseFacade, CancellationToken)"/>
/// çağrılır.</item>
/// </list>
/// </remarks>
public static class EfMigrationExtensions
{
    private const string NpgsqlProvider = "Npgsql.EntityFrameworkCore.PostgreSQL";

    /// <summary>
    /// Veritabanını en güncel migration'a taşır. Legacy (migration geçmişi olmayan ama tabloları olan)
    /// veritabanlarında önce <paramref name="upgradeLegacySchema"/> çalıştırılır ve InitialCreate baseline'lanır.
    /// </summary>
    /// <param name="db">Migrate edilecek context.</param>
    /// <param name="upgradeLegacySchema">
    /// Yalnızca legacy DB'de, baseline'dan önce aynı transaction içinde çalışır. Eski bir DB'yi InitialCreate
    /// modeline getiren idempotent SQL (ADD COLUMN IF NOT EXISTS, backfill, isim düzeltmeleri) içermelidir.
    /// Eksik tabloları/index'leri yaratmaya gerek yoktur; helper bunları InitialCreate'ten üretir.
    /// </param>
    /// <param name="ct">İptal belirteci.</param>
    public static async Task MigrateDatabaseAsync<TContext>(
        this TContext db,
        Func<TContext, CancellationToken, Task>? upgradeLegacySchema = null,
        CancellationToken ct = default)
        where TContext : DbContext
    {
        ArgumentNullException.ThrowIfNull(db);
        var contextName = typeof(TContext).Name;
        var logger = db.GetService<ILoggerFactory>().CreateLogger("DijitalAtolye.Migrations." + contextName);

        if (!string.Equals(db.Database.ProviderName, NpgsqlProvider, StringComparison.Ordinal))
        {
            await db.Database.MigrateAsync(ct).ConfigureAwait(false);
            return;
        }

        await EnsureDatabaseExistsAsync(db, logger, ct).ConfigureAwait(false);

        await db.Database.OpenConnectionAsync(ct).ConfigureAwait(false);
        var lockKey = AdvisoryLockKey(typeof(TContext));
        try
        {
            await ExecuteScalarAsync(db, "SELECT pg_advisory_lock(@key)", ("@key", lockKey), ct).ConfigureAwait(false);
            try
            {
                await MigrateUnderLockAsync(db, contextName, upgradeLegacySchema, logger, ct).ConfigureAwait(false);
            }
            finally
            {
                await ExecuteScalarAsync(db, "SELECT pg_advisory_unlock(@key)", ("@key", lockKey), CancellationToken.None)
                    .ConfigureAwait(false);
            }
        }
        finally
        {
            await db.Database.CloseConnectionAsync().ConfigureAwait(false);
        }
    }

    private static async Task MigrateUnderLockAsync<TContext>(
        TContext db,
        string contextName,
        Func<TContext, CancellationToken, Task>? upgradeLegacySchema,
        ILogger logger,
        CancellationToken ct)
        where TContext : DbContext
    {
        var allMigrations = db.Database.GetMigrations().ToList();
        if (allMigrations.Count == 0)
        {
            throw new InvalidOperationException($"{contextName} için migration bulunamadı.");
        }

        // History tablosu yokken IHistoryRepository.Exists/GetAppliedMigrations EF'te "Failed executing DbCommand"
        // hatası loglar; önce information_schema'ya bakıyoruz.
        var relational = RelationalOptionsExtension.Extract(db.GetService<IDbContextOptions>());
        var historyExists = await TableExistsAsync(
            db,
            relational.MigrationsHistoryTableSchema ?? db.Model.GetDefaultSchema() ?? "public",
            relational.MigrationsHistoryTableName ?? HistoryRepository.DefaultTableName,
            ct).ConfigureAwait(false);
        var applied = historyExists
            ? (await db.Database.GetAppliedMigrationsAsync(ct).ConfigureAwait(false)).ToList()
            : [];
        if (applied.Count == 0)
        {
            var initialId = allMigrations[0];
            var initial = LoadMigration(db, initialId);
            var createTables = initial.UpOperations.OfType<CreateTableOperation>().ToList();
            var existing = await GetExistingTablesAsync(db, createTables, ct).ConfigureAwait(false);

            if (existing.Count > 0)
            {
                logger.LogWarning(
                    "{Context}: migration geçmişi yok ama {Existing}/{Total} tablo mevcut — legacy DB, {Migration} baseline'lanıyor.",
                    contextName, existing.Count, createTables.Count, initialId);
                await BaselineLegacyDatabaseAsync(db, initialId, initial, existing, upgradeLegacySchema, logger, ct)
                    .ConfigureAwait(false);
                applied.Add(initialId);
            }
            else
            {
                logger.LogInformation("{Context}: boş veritabanı, tüm migration'lar uygulanacak.", contextName);
            }
        }

        var pending = allMigrations.Except(applied, StringComparer.Ordinal).ToList();
        await db.Database.MigrateAsync(ct).ConfigureAwait(false);

        if (pending.Count == 0)
        {
            logger.LogInformation("{Context}: şema güncel ({Last}).", contextName, allMigrations[^1]);
        }
        else
        {
            logger.LogInformation("{Context}: {Count} migration uygulandı: {Migrations}.",
                contextName, pending.Count, string.Join(", ", pending));
        }
    }

    private static async Task BaselineLegacyDatabaseAsync<TContext>(
        TContext db,
        string initialId,
        Migration initial,
        HashSet<(string Schema, string Table)> existingTables,
        Func<TContext, CancellationToken, Task>? upgradeLegacySchema,
        ILogger logger,
        CancellationToken ct)
        where TContext : DbContext
    {
        var model = FinalizeModel(db, initial.TargetModel);
        var ops = initial.UpOperations;
        var defaultSchema = model?.GetDefaultSchema();

        string SchemaOf(string? schema) => schema ?? defaultSchema ?? "public";
        bool Existed(string? schema, string table) => existingTables.Contains((SchemaOf(schema), table));

        await using var tx = await db.Database.BeginTransactionAsync(ct).ConfigureAwait(false);

        // 1) Şemalar / extension'lar (idempotent DDL).
        await ExecuteOperationsAsync(db, model,
            ops.Where(o => o is EnsureSchemaOperation or AlterDatabaseOperation).ToList(), ct).ConfigureAwait(false);

        // 2) Servise özgü eski-şema yükseltmesi (ADD COLUMN IF NOT EXISTS, backfill, isim düzeltmeleri).
        if (upgradeLegacySchema is not null)
        {
            await upgradeLegacySchema(db, ct).ConfigureAwait(false);
        }

        // 3) InitialCreate'te olup DB'de olmayan tablolar (+ index/FK'leri) — InitialCreate'in kendi DDL'iyle.
        var missingTableOps = ops.Where(o => o switch
        {
            CreateTableOperation t => !Existed(t.Schema, t.Name),
            CreateIndexOperation i => !Existed(i.Schema, i.Table),
            AddForeignKeyOperation f => !Existed(f.Schema, f.Table),
            _ => false,
        }).ToList();
        if (missingTableOps.Count > 0)
        {
            logger.LogWarning("Legacy DB: eksik tablolar yaratılıyor: {Tables}.",
                string.Join(", ", missingTableOps.OfType<CreateTableOperation>().Select(t => $"{SchemaOf(t.Schema)}.{t.Name}")));
            await ExecuteOperationsAsync(db, model, missingTableOps, ct).ConfigureAwait(false);
        }

        // 4) Var olan tablolarda eksik index'ler.
        var existingIndexes = await GetExistingIndexesAsync(db, ct).ConfigureAwait(false);
        var missingIndexOps = ops.OfType<CreateIndexOperation>()
            .Where(i => Existed(i.Schema, i.Table) && !existingIndexes.Contains((SchemaOf(i.Schema), i.Name)))
            .Cast<MigrationOperation>()
            .ToList();
        if (missingIndexOps.Count > 0)
        {
            logger.LogWarning("Legacy DB: eksik index'ler yaratılıyor: {Indexes}.",
                string.Join(", ", missingIndexOps.Cast<CreateIndexOperation>().Select(i => i.Name)));
            await ExecuteOperationsAsync(db, model, missingIndexOps, ct).ConfigureAwait(false);
        }

        // 5) Kolon doğrulaması: eksik kolon varsa baseline YAPMA (transaction geri alınır).
        await VerifyColumnsAsync(db, ops.OfType<CreateTableOperation>().ToList(), SchemaOf, logger, ct).ConfigureAwait(false);
        await WarnMissingForeignKeysAsync(db, ops, SchemaOf, logger, ct).ConfigureAwait(false);

        // 6) History tablosu + InitialCreate satırı.
        var history = db.GetService<IHistoryRepository>();
        await ExecuteSqlAsync(db, history.GetCreateIfNotExistsScript(), ct).ConfigureAwait(false);
        await ExecuteSqlAsync(db, history.GetInsertScript(new HistoryRow(initialId, ProductInfo.GetVersion())), ct)
            .ConfigureAwait(false);

        await tx.CommitAsync(ct).ConfigureAwait(false);
        logger.LogWarning("Legacy DB baseline tamam: {Migration} uygulanmış olarak işaretlendi.", initialId);
    }

    private static async Task VerifyColumnsAsync(
        DbContext db,
        IReadOnlyList<CreateTableOperation> tables,
        Func<string?, string> schemaOf,
        ILogger logger,
        CancellationToken ct)
    {
        var missing = new List<string>();
        foreach (var table in tables)
        {
            var schema = schemaOf(table.Schema);
            var actual = new Dictionary<string, (string Type, bool Nullable)>(StringComparer.Ordinal);
            await using (var cmd = CreateCommand(db, """
                SELECT a.attname, format_type(a.atttypid, a.atttypmod), NOT a.attnotnull
                FROM pg_attribute a
                JOIN pg_class c ON c.oid = a.attrelid
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = @schema AND c.relname = @table AND a.attnum > 0 AND NOT a.attisdropped
                """))
            {
                AddParameter(cmd, "@schema", schema);
                AddParameter(cmd, "@table", table.Name);
                await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
                while (await reader.ReadAsync(ct).ConfigureAwait(false))
                {
                    actual[reader.GetString(0)] = (reader.GetString(1), reader.GetBoolean(2));
                }
            }

            foreach (var column in table.Columns)
            {
                if (!actual.TryGetValue(column.Name, out var found))
                {
                    missing.Add($"{schema}.{table.Name}.{column.Name}");
                    continue;
                }

                if (column.ColumnType is not null
                    && !string.Equals(column.ColumnType, found.Type, StringComparison.OrdinalIgnoreCase))
                {
                    logger.LogWarning("Legacy DB: {Table}.{Column} tipi farklı (model: {Expected}, DB: {Actual}).",
                        $"{schema}.{table.Name}", column.Name, column.ColumnType, found.Type);
                }

                if (column.IsNullable != found.Nullable)
                {
                    logger.LogWarning("Legacy DB: {Table}.{Column} nullability farklı (model: {Expected}, DB: {Actual}).",
                        $"{schema}.{table.Name}", column.Name,
                        column.IsNullable ? "NULL" : "NOT NULL", found.Nullable ? "NULL" : "NOT NULL");
                }
            }
        }

        if (missing.Count > 0)
        {
            throw new InvalidOperationException(
                "Legacy DB InitialCreate modeline getirilemedi; eksik kolonlar: " + string.Join(", ", missing) +
                ". Servisin upgradeLegacySchema SQL'ine ADD COLUMN ekleyin. Baseline yapılmadı (transaction geri alındı).");
        }
    }

    /// <summary>Eksik FK'ler eklenmez (yetim satır varsa açılış patlar); yalnızca uyarı loglanır.</summary>
    private static async Task WarnMissingForeignKeysAsync(
        DbContext db,
        IReadOnlyList<MigrationOperation> ops,
        Func<string?, string> schemaOf,
        ILogger logger,
        CancellationToken ct)
    {
        var expected = ops.OfType<CreateTableOperation>().SelectMany(t => t.ForeignKeys)
            .Concat(ops.OfType<AddForeignKeyOperation>())
            .Select(f => (Schema: schemaOf(f.Schema), f.Name))
            .ToList();
        if (expected.Count == 0) return;

        var existing = new HashSet<(string, string)>();
        await using (var cmd = CreateCommand(db, """
            SELECT n.nspname, c.conname FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE c.contype = 'f'
            """))
        {
            await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
            while (await reader.ReadAsync(ct).ConfigureAwait(false))
            {
                existing.Add((reader.GetString(0), reader.GetString(1)));
            }
        }

        foreach (var fk in expected.Where(f => !existing.Contains(f)))
        {
            logger.LogWarning("Legacy DB: foreign key {Schema}.{ForeignKey} yok (eklenmedi).", fk.Schema, fk.Name);
        }
    }

    private static async Task<HashSet<(string Schema, string Table)>> GetExistingTablesAsync(
        DbContext db,
        IReadOnlyList<CreateTableOperation> tables,
        CancellationToken ct)
    {
        var defaultSchema = db.Model.GetDefaultSchema() ?? "public";
        var result = new HashSet<(string, string)>();
        foreach (var t in tables)
        {
            var schema = t.Schema ?? defaultSchema;
            if (await TableExistsAsync(db, schema, t.Name, ct).ConfigureAwait(false))
            {
                result.Add((schema, t.Name));
            }
        }
        return result;
    }

    private static async Task<bool> TableExistsAsync(DbContext db, string schema, string table, CancellationToken ct)
    {
        await using var cmd = CreateCommand(db, """
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = @schema AND table_name = @table)
            """);
        AddParameter(cmd, "@schema", schema);
        AddParameter(cmd, "@table", table);
        return await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false) is true;
    }

    private static async Task<HashSet<(string Schema, string Index)>> GetExistingIndexesAsync(DbContext db, CancellationToken ct)
    {
        var result = new HashSet<(string, string)>();
        await using var cmd = CreateCommand(db, "SELECT schemaname, indexname FROM pg_indexes");
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            result.Add((reader.GetString(0), reader.GetString(1)));
        }
        return result;
    }

    private static Migration LoadMigration(DbContext db, string migrationId)
    {
        var assembly = db.GetService<IMigrationsAssembly>();
        if (!assembly.Migrations.TryGetValue(migrationId, out var type))
        {
            throw new InvalidOperationException($"Migration bulunamadı: {migrationId}");
        }
        return assembly.CreateMigration(type, db.Database.ProviderName!);
    }

    private static IModel? FinalizeModel(DbContext db, IModel? model)
    {
        if (model is IMutableModel mutable)
        {
            model = mutable.FinalizeModel();
        }
        return model is null ? null : db.GetService<IModelRuntimeInitializer>().Initialize(model);
    }

    private static async Task ExecuteOperationsAsync(
        DbContext db,
        IModel? model,
        IReadOnlyList<MigrationOperation> operations,
        CancellationToken ct)
    {
        if (operations.Count == 0) return;
        var commands = db.GetService<IMigrationsSqlGenerator>().Generate(operations, model);
        foreach (var command in commands)
        {
            await ExecuteSqlAsync(db, command.CommandText, ct).ConfigureAwait(false);
        }
    }

    private static async Task ExecuteSqlAsync(DbContext db, string sql, CancellationToken ct)
    {
        await using var cmd = CreateCommand(db, sql);
        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    private static async Task ExecuteScalarAsync(DbContext db, string sql, (string Name, object Value) parameter, CancellationToken ct)
    {
        await using var cmd = CreateCommand(db, sql);
        AddParameter(cmd, parameter.Name, parameter.Value);
        await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
    }

    private static DbCommand CreateCommand(DbContext db, string sql)
    {
        var cmd = db.Database.GetDbConnection().CreateCommand();
#pragma warning disable CA2100 // SQL EF'in kendi generator'ından veya bu sınıftaki sabitlerden gelir; kullanıcı girdisi yok.
        cmd.CommandText = sql;
#pragma warning restore CA2100
        cmd.Transaction = db.Database.CurrentTransaction?.GetDbTransaction();
        return cmd;
    }

    private static void AddParameter(DbCommand cmd, string name, object value)
    {
        var p = cmd.CreateParameter();
        p.ParameterName = name;
        p.Value = value;
        cmd.Parameters.Add(p);
    }

    private static async Task EnsureDatabaseExistsAsync(DbContext db, ILogger logger, CancellationToken ct)
    {
        var creator = (RelationalDatabaseCreator)db.GetService<IDatabaseCreator>();
        if (await creator.ExistsAsync(ct).ConfigureAwait(false)) return;

        logger.LogInformation("Veritabanı yok, oluşturuluyor.");
        try
        {
            await creator.CreateAsync(ct).ConfigureAwait(false);
        }
        catch (DbException ex) when (ex.SqlState is "42P04" or "23505")
        {
            // duplicate_database (veya pg_database unique ihlali): başka bir replika aynı anda oluşturdu.
        }
    }

    /// <summary>Context tipine göre kararlı (process'ler arası aynı) advisory lock anahtarı.</summary>
    private static long AdvisoryLockKey(Type contextType)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes("dijitalatolye:migrate:" + contextType.FullName));
        return BitConverter.ToInt64(hash, 0);
    }
}
