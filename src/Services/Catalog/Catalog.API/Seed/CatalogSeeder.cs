using DijitalAtolye.Catalog.API.Domain;
using DijitalAtolye.Catalog.API.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Catalog.API.Seed;

/// <summary>
/// MEB sınıf/ders/kazanım veri seti için başlangıç seeder.
/// V1'de ilk birkaç sınıf ve örnek ders ile başlıyor; production'da CSV/JSON
/// import scripti ile tüm MEB kataloğu yüklenir.
/// </summary>
public static class CatalogSeeder
{
    public static async Task SeedAsync(CatalogDbContext db, CancellationToken ct = default)
    {
        if (await db.Grades.AnyAsync(ct))
        {
            return;
        }

        var grades = Enumerable.Range(1, 12)
            .Select(i => new Grade
            {
                Id = i,
                Code = i.ToString(),
                Name = $"{i}. Sınıf",
                EducationStage = i <= 4 ? "İlkokul" : i <= 8 ? "Ortaokul" : "Lise",
            }).ToList();
        db.Grades.AddRange(grades);

        // Ders/ünite/kazanım verisi MEB Excel import'undan gelir (Seed/meb-outcomes.json → MebCatalogImporter).
        // Burada yalnızca sınıflar ve içerik kategorileri seed'lenir.

        db.Categories.AddRange(
            new Category { Code = "oyun", Name = "Oyun", Description = "Eğlenceli oyun bazlı içerikler" },
            new Category { Code = "simulasyon", Name = "Simülasyon", Description = "Etkileşimli simülasyonlar" },
            new Category { Code = "alistirma", Name = "Alıştırma", Description = "Kazanım pekiştiren alıştırmalar" });

        await db.SaveChangesAsync(ct);
    }
}
