using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Catalog.API.Persistence;

/// <summary>
/// Migration öncesi (EnsureCreated ile kurulmuş) catalog DB'sini InitialCreate modeline getirir.
/// Yalnızca legacy DB baseline'lanırken bir kez çalışır; bkz. <c>EfMigrationExtensions.MigrateDatabaseAsync</c>.
/// </summary>
public static class CatalogLegacySchema
{
    public static async Task UpgradeAsync(CatalogDbContext db, CancellationToken ct)
    {
        // Outcome.Description varchar(1000) -> text (bazı MEB kazanımları 1000 karakteri aşıyor).
        await db.Database.ExecuteSqlRawAsync(
            """ALTER TABLE IF EXISTS catalog."Outcomes" ALTER COLUMN "Description" TYPE text;""", ct);
    }
}
