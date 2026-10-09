using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Notification.API.Persistence;

/// <summary>
/// Migration öncesi kurulmuş notification DB'sini InitialCreate modeline getirir. Eksik PushSubscriptions tablosunu
/// helper InitialCreate'ten yaratır; burada yalnızca eski açılış DDL'inin bıraktığı farklar düzeltilir.
/// </summary>
public static class NotificationLegacySchema
{
    public static async Task UpgradeAsync(NotificationDbContext db, CancellationToken ct)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            ALTER TABLE IF EXISTS notification."PushSubscriptions" ALTER COLUMN "CreatedAtUtc" DROP DEFAULT;
            """, ct);
    }
}
