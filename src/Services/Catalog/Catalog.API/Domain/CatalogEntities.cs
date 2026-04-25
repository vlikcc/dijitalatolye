namespace DijitalAtolye.Catalog.API.Domain;

public sealed class Grade
{
    public int Id { get; init; }
    public required string Code { get; init; }   // örn. "5", "9", "12"
    public required string Name { get; init; }   // "5. Sınıf"
    public string? EducationStage { get; init; } // İlkokul / Ortaokul / Lise
}

public sealed class Subject
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Code { get; init; }   // örn. "matematik"
    public required string Name { get; init; }   // "Matematik"
    public string? IconUrl { get; init; }
}

public sealed class Unit
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid SubjectId { get; init; }
    public required int GradeId { get; init; }
    public required int Order { get; init; }
    public required string Name { get; init; }
}

public sealed class Outcome
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid UnitId { get; init; }
    public required string Code { get; init; }   // MEB kazanım kodu (örn. "M.5.1.1.1")
    public required string Description { get; init; }
}

public sealed class Tag
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Slug { get; init; }
    public required string DisplayName { get; init; }
    public TagStatus Status { get; set; } = TagStatus.Pending;
    public int UsageCount { get; set; }
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
    public Guid? CreatedByUserId { get; init; }
}

public enum TagStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
}

public sealed class Category
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Code { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
}
