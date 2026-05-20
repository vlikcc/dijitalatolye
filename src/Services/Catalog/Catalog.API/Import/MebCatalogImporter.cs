using DijitalAtolye.Catalog.API.Domain;
using DijitalAtolye.Catalog.API.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Catalog.API.Import;

public sealed class MebCatalogImporter
{
    private readonly CatalogDbContext _db;

    public MebCatalogImporter(CatalogDbContext db) => _db = db;

    public async Task<MebImportResult> ImportAsync(IReadOnlyList<MebImportRow> rows, CancellationToken ct)
    {
        var imported = 0;
        foreach (var row in rows)
        {
            var grade = await _db.Grades.FirstOrDefaultAsync(g => g.Code == row.GradeCode, ct);
            if (grade is null)
            {
                grade = new Grade
                {
                    Id = int.TryParse(row.GradeCode, out var gid) ? gid : await NextGradeIdAsync(ct),
                    Code = row.GradeCode,
                    Name = $"{row.GradeCode}. Sınıf",
                };
                _db.Grades.Add(grade);
                await _db.SaveChangesAsync(ct);
            }

            var subject = await _db.Subjects.FirstOrDefaultAsync(s => s.Code == row.SubjectCode, ct);
            if (subject is null)
            {
                subject = new Subject { Code = row.SubjectCode, Name = row.SubjectName ?? row.SubjectCode };
                _db.Subjects.Add(subject);
                await _db.SaveChangesAsync(ct);
            }

            var unit = await _db.Units.FirstOrDefaultAsync(u =>
                u.SubjectId == subject.Id && u.GradeId == grade.Id && u.Name == row.UnitName, ct);
            if (unit is null)
            {
                unit = new Unit
                {
                    SubjectId = subject.Id,
                    GradeId = grade.Id,
                    Name = row.UnitName,
                    Order = row.UnitOrder,
                };
                _db.Units.Add(unit);
                await _db.SaveChangesAsync(ct);
            }

            if (await _db.Outcomes.AnyAsync(o => o.Code == row.OutcomeCode, ct))
                continue;

            _db.Outcomes.Add(new Outcome
            {
                UnitId = unit.Id,
                Code = row.OutcomeCode,
                Description = row.OutcomeDescription,
            });
            imported++;
        }

        await _db.SaveChangesAsync(ct);
        return new MebImportResult(imported, rows.Count);
    }

    private async Task<int> NextGradeIdAsync(CancellationToken ct) =>
        (await _db.Grades.MaxAsync(g => (int?)g.Id, ct) ?? 0) + 1;
}

public sealed record MebImportRow(
    string GradeCode,
    string SubjectCode,
    string? SubjectName,
    string UnitName,
    int UnitOrder,
    string OutcomeCode,
    string OutcomeDescription);

public sealed record MebImportResult(int Imported, int TotalRows);
