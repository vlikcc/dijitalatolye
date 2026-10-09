using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.User.API.Persistence;

/// <summary>
/// Migration öncesi kurulmuş user DB'sini InitialCreate modeline getirir. Yalnızca legacy DB baseline'lanırken
/// bir kez çalışır. Eksik tablolar (Assignments, Classes, ...) helper tarafından InitialCreate'ten yaratılır.
/// </summary>
public static class UserLegacySchema
{
    public static async Task UpgradeAsync(UserDbContext db, CancellationToken ct)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            ALTER TABLE IF EXISTS "user"."Assignments" ADD COLUMN IF NOT EXISTS "ClassId" uuid;
            ALTER TABLE IF EXISTS "user"."AssignmentMembers" ADD COLUMN IF NOT EXISTS "ReminderSentAtUtc" timestamp with time zone;

            -- Eski açılış DDL'i Assignment*/Class* tablolarını EF'ten farklı index/FK adları ve kolon default'larıyla
            -- yaratıyordu. Sonraki migration'lar EF adlarını beklediği için normalize et.
            DO $migration$
            BEGIN
              IF to_regclass('"user"."IX_AssignmentMembers_Assignment_Student"') IS NOT NULL THEN
                IF to_regclass('"user"."IX_AssignmentMembers_AssignmentId_StudentUserId"') IS NULL THEN
                  ALTER INDEX "user"."IX_AssignmentMembers_Assignment_Student"
                    RENAME TO "IX_AssignmentMembers_AssignmentId_StudentUserId";
                ELSE
                  DROP INDEX "user"."IX_AssignmentMembers_Assignment_Student";
                END IF;
              END IF;
              IF to_regclass('"user"."IX_ClassMembers_Class_Student"') IS NOT NULL THEN
                IF to_regclass('"user"."IX_ClassMembers_ClassId_StudentUserId"') IS NULL THEN
                  ALTER INDEX "user"."IX_ClassMembers_Class_Student"
                    RENAME TO "IX_ClassMembers_ClassId_StudentUserId";
                ELSE
                  DROP INDEX "user"."IX_ClassMembers_Class_Student";
                END IF;
              END IF;
              IF EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace
                         WHERE n.nspname = 'user' AND c.conname = 'FK_AssignmentMembers_Assignments') THEN
                ALTER TABLE "user"."AssignmentMembers"
                  RENAME CONSTRAINT "FK_AssignmentMembers_Assignments" TO "FK_AssignmentMembers_Assignments_AssignmentId";
              END IF;
              IF EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace
                         WHERE n.nspname = 'user' AND c.conname = 'FK_ClassMembers_Classes') THEN
                ALTER TABLE "user"."ClassMembers"
                  RENAME CONSTRAINT "FK_ClassMembers_Classes" TO "FK_ClassMembers_Classes_ClassId";
              END IF;
            END $migration$;

            -- Model bu kolonlarda default tanımlamıyor (EF her INSERT'te değeri kendisi yazar).
            ALTER TABLE IF EXISTS "user"."Assignments"
              ALTER COLUMN "ContentTitle" DROP DEFAULT,
              ALTER COLUMN "Title" DROP DEFAULT,
              ALTER COLUMN "Status" DROP DEFAULT,
              ALTER COLUMN "CreatedAtUtc" DROP DEFAULT,
              ALTER COLUMN "UpdatedAtUtc" DROP DEFAULT;
            ALTER TABLE IF EXISTS "user"."AssignmentMembers"
              ALTER COLUMN "StudentEmail" DROP DEFAULT,
              ALTER COLUMN "JoinedAtUtc" DROP DEFAULT;
            ALTER TABLE IF EXISTS "user"."Classes"
              ALTER COLUMN "CreatedAtUtc" DROP DEFAULT,
              ALTER COLUMN "UpdatedAtUtc" DROP DEFAULT;
            ALTER TABLE IF EXISTS "user"."ClassMembers"
              ALTER COLUMN "StudentEmail" DROP DEFAULT,
              ALTER COLUMN "AddedAtUtc" DROP DEFAULT;
            """, ct);
    }
}
