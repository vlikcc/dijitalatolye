using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Content.API.Persistence;

/// <summary>
/// Migration öncesi (EnsureCreated + açılışta idempotent ALTER) kurulmuş content DB'sini InitialCreate modeline
/// getirir. Yalnızca legacy DB baseline'lanırken bir kez çalışır; bkz. <c>EfMigrationExtensions.MigrateDatabaseAsync</c>.
/// </summary>
public static class ContentLegacySchema
{
    public static async Task UpgradeAsync(ContentDbContext db, CancellationToken ct)
    {
        // EF ExecuteSqlRawAsync { } karakterlerini format placeholder sayar — PostgreSQL '{}' için {{}} kullan.
        await db.Database.ExecuteSqlRawAsync(
            """
            ALTER TABLE IF EXISTS content."Contents" ADD COLUMN IF NOT EXISTS "AiSuggestionJson" text;
            ALTER TABLE IF EXISTS content."ContentVersions" ADD COLUMN IF NOT EXISTS "GuardFileId" character varying(64);
            ALTER TABLE IF EXISTS content."ContentVersions" ADD COLUMN IF NOT EXISTS "GuardScanStatus" character varying(40);
            ALTER TABLE IF EXISTS content."ContentVersions" ADD COLUMN IF NOT EXISTS "GuardScannedAtUtc" timestamp with time zone;
            ALTER TABLE IF EXISTS content."Contents" ADD COLUMN IF NOT EXISTS "Type" character varying(20) NOT NULL DEFAULT 'Game';
            ALTER TABLE IF EXISTS content."Contents" ADD COLUMN IF NOT EXISTS "AutoRejectReason" text;
            ALTER TABLE IF EXISTS content."Contents" ADD COLUMN IF NOT EXISTS "Subjects" text[] NOT NULL DEFAULT '{{}}';
            ALTER TABLE IF EXISTS content."Contents" ADD COLUMN IF NOT EXISTS "GradeLevels" integer[] NOT NULL DEFAULT '{{}}';
            -- Varsayılanlar yalnızca mevcut satırları doldurmak içindi; model bu kolonlarda default tanımlamıyor.
            ALTER TABLE IF EXISTS content."Contents" ALTER COLUMN "Subjects" DROP DEFAULT;
            ALTER TABLE IF EXISTS content."Contents" ALTER COLUMN "GradeLevels" DROP DEFAULT;
            """, ct);

        // Eski tek-değer kolonları (Subject, GradeLevel) yalnızca eski DB'lerde vardır: çoklu kolonlara taşı ve
        // NOT NULL'ı kaldır (model artık yazmıyor; NOT NULL kalırsa yeni INSERT'ler 23502 ile patlar).
        // Veri kaybı olmasın diye kolonlar silinmez.
        await db.Database.ExecuteSqlRawAsync(
            """
            DO $migration$
            BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'content' AND table_name = 'Contents' AND column_name = 'Subject'
              ) THEN
                UPDATE content."Contents"
                SET "Subjects" = ARRAY["Subject"]
                WHERE cardinality("Subjects") = 0
                  AND "Subject" IS NOT NULL
                  AND btrim("Subject") <> '';
                ALTER TABLE content."Contents" ALTER COLUMN "Subject" DROP NOT NULL;
              END IF;
              IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'content' AND table_name = 'Contents' AND column_name = 'GradeLevel'
              ) THEN
                UPDATE content."Contents"
                SET "GradeLevels" = ARRAY["GradeLevel"]
                WHERE cardinality("GradeLevels") = 0
                  AND "GradeLevel" IS NOT NULL;
                ALTER TABLE content."Contents" ALTER COLUMN "GradeLevel" DROP NOT NULL;
              END IF;
            END $migration$;
            """, ct);
    }
}
