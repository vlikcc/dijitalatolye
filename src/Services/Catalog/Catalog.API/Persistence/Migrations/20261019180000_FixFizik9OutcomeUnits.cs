using DijitalAtolye.Catalog.API.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DijitalAtolye.Catalog.API.Persistence.Migrations;

/// <summary>
/// Veri düzeltmesi: kaynak Excel'de satırları kaymış iki 9. sınıf Fizik kazanımını doğru üniteye taşır
/// (FİZ.9.1.4 → "FİZİK BİLİMİ VE KARİYER KEŞFİ", FİZ.9.2.2 → "KUVVET VE HAREKET").
/// MEB importer mevcut kazanımları güncellemediği için kurulu veritabanları seed JSON düzeltmesini almaz.
/// Ünite veya kazanım yoksa (boş veritabanı) hiçbir satır etkilenmez.
/// </summary>
[DbContext(typeof(CatalogDbContext))]
[Migration("20261019180000_FixFizik9OutcomeUnits")]
public partial class FixFizik9OutcomeUnits : Migration
{
    private const string BilimVeKariyer = "FİZİK BİLİMİ VE KARİYER KEŞFİ";
    private const string KuvvetVeHareket = "KUVVET VE HAREKET";

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(MoveOutcome("FİZ.9.1.4", BilimVeKariyer));
        migrationBuilder.Sql(MoveOutcome("FİZ.9.2.2", KuvvetVeHareket));
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(MoveOutcome("FİZ.9.1.4", KuvvetVeHareket));
        migrationBuilder.Sql(MoveOutcome("FİZ.9.2.2", BilimVeKariyer));
    }

    private static string MoveOutcome(string outcomeCode, string unitName) => $"""
        UPDATE catalog."Outcomes" AS o
        SET "UnitId" = u."Id"
        FROM catalog."Units" AS u
        JOIN catalog."Subjects" AS s ON s."Id" = u."SubjectId"
        JOIN catalog."Grades" AS g ON g."Id" = u."GradeId"
        WHERE o."Code" = '{outcomeCode}'
          AND s."Code" = 'fizik'
          AND g."Code" = '9'
          AND u."Name" = '{unitName}';
        """;
}
