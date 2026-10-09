using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Analytics.API.Persistence;

/// <summary>
/// Migration öncesi (EnsureCreated + açılışta idempotent DDL) kurulmuş analytics DB'sini InitialCreate modeline
/// getirir. Eksik tablolar (outcome_daily_stats, aggregation_state) ve index'ler helper tarafından InitialCreate'ten
/// yaratılır. Yalnızca legacy DB baseline'lanırken bir kez çalışır.
/// </summary>
public static class AnalyticsLegacySchema
{
    public static async Task UpgradeAsync(AnalyticsDbContext db, CancellationToken ct)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            ALTER TABLE IF EXISTS analytics.events ADD COLUMN IF NOT EXISTS "Score" integer;
            ALTER TABLE IF EXISTS analytics.events ADD COLUMN IF NOT EXISTS "OutcomeCode" character varying(32);
            ALTER TABLE IF EXISTS analytics.content_daily_stats ADD COLUMN IF NOT EXISTS "ScoreSum" bigint NOT NULL DEFAULT 0;
            ALTER TABLE IF EXISTS analytics.content_daily_stats ADD COLUMN IF NOT EXISTS "ScoreCount" integer NOT NULL DEFAULT 0;
            -- Varsayılanlar yalnızca mevcut satırları doldurmak içindi; model default tanımlamıyor.
            ALTER TABLE IF EXISTS analytics.content_daily_stats ALTER COLUMN "ScoreSum" DROP DEFAULT;
            ALTER TABLE IF EXISTS analytics.content_daily_stats ALTER COLUMN "ScoreCount" DROP DEFAULT;
            """, ct);
    }
}
