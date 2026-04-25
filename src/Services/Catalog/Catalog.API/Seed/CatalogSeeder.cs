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

        var matematik = new Subject { Code = "matematik", Name = "Matematik" };
        var turkce = new Subject { Code = "turkce", Name = "Türkçe" };
        var fen = new Subject { Code = "fen", Name = "Fen Bilimleri" };
        var sosyal = new Subject { Code = "sosyal", Name = "Sosyal Bilgiler" };
        var ingilizce = new Subject { Code = "ingilizce", Name = "İngilizce" };
        db.Subjects.AddRange(matematik, turkce, fen, sosyal, ingilizce);

        var grade5 = grades.First(g => g.Id == 5);
        var unit = new Unit
        {
            SubjectId = matematik.Id,
            GradeId = grade5.Id,
            Order = 1,
            Name = "Doğal Sayılar",
        };
        db.Units.Add(unit);

        db.Outcomes.AddRange(
            new Outcome { UnitId = unit.Id, Code = "M.5.1.1.1", Description = "En çok dokuz basamaklı doğal sayıları okur ve yazar." },
            new Outcome { UnitId = unit.Id, Code = "M.5.1.1.2", Description = "Doğal sayıların basamaklarını ve basamak değerlerini belirler." });

        db.Categories.AddRange(
            new Category { Code = "oyun", Name = "Oyun", Description = "Eğlenceli oyun bazlı içerikler" },
            new Category { Code = "simulasyon", Name = "Simülasyon", Description = "Etkileşimli simülasyonlar" },
            new Category { Code = "alistirma", Name = "Alıştırma", Description = "Kazanım pekiştiren alıştırmalar" });

        await db.SaveChangesAsync(ct);
    }
}
