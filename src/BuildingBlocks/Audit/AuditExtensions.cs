using DijitalAtolye.BuildingBlocks.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
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

    /// <summary>
    /// Audit veritabanını EF migration'larıyla günceller. Eski <c>EnsureAuditSchemaAsync</c> ile kurulmuş
    /// (migration geçmişi olmayan) DB'ler otomatik baseline'lanır; bkz. <see cref="EfMigrationExtensions"/>.
    /// </summary>
    public static async Task MigrateAuditDatabaseAsync(this IServiceProvider services, CancellationToken ct = default)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AuditDbContext>();
        await db.MigrateDatabaseAsync(ct: ct).ConfigureAwait(false);
    }
}
