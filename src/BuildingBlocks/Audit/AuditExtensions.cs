using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace DijitalAtolye.BuildingBlocks.Audit;

public static class AuditExtensions
{
    public static IServiceCollection AddDijitalAtolyeAudit(
        this IServiceCollection services,
        IConfiguration configuration,
        string serviceName,
        string? connectionStringOverride = null)
    {
        var conn = connectionStringOverride
            ?? configuration.GetConnectionString("Audit")
            ?? configuration.GetConnectionString("Postgres")
            ?? "Host=localhost;Port=5432;Database=audit;Username=postgres;Password=";

        services.AddSingleton(new AuditServiceContext { ServiceName = serviceName });
        services.AddDbContext<AuditDbContext>(o => o.UseNpgsql(conn));
        services.AddHttpContextAccessor();
        services.AddScoped<IAuditLogger, EfAuditLogger>();
        services.TryAddSingleton<IAuditEventPublisher, NullAuditEventPublisher>();
        return services;
    }

    public static IServiceCollection AddAuditEventPublisher<TPublisher>(this IServiceCollection services)
        where TPublisher : class, IAuditEventPublisher
    {
        services.RemoveAll<IAuditEventPublisher>();
        services.AddSingleton<IAuditEventPublisher, TPublisher>();
        return services;
    }

    public static async Task EnsureAuditSchemaAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AuditDbContext>();
        var creator = (RelationalDatabaseCreator)db.Database.GetService<IDatabaseCreator>();
        if (!await creator.ExistsAsync().ConfigureAwait(false))
        {
            await creator.CreateAsync().ConfigureAwait(false);
            return;
        }
        // DB var; tablolar yoksa sadece audit tablolarini olustur (DB'deki diger tablolari etkilemez)
        await using var conn = db.Database.GetDbConnection();
        await conn.OpenAsync().ConfigureAwait(false);
        await using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'audit');";
            var result = await cmd.ExecuteScalarAsync().ConfigureAwait(false);
            if (result is bool b && b)
            {
                return;
            }
        }
        await using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = creator.GenerateCreateScript();
            await cmd.ExecuteNonQueryAsync().ConfigureAwait(false);
        }
    }
}
