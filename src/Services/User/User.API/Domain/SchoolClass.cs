namespace DijitalAtolye.User.API.Domain;

/// <summary>
/// Öğretmenin oluşturduğu sınıf (ör. "9. sınıf Matematik"). Kayıtlı öğrenciler üye olur;
/// öğretmen sınıftaki öğrencilere tek tek veya toplu ödev atar.
/// </summary>
public sealed class SchoolClass
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required Guid TeacherUserId { get; set; }
    public required string Name { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public ICollection<ClassMember> Members { get; set; } = [];
}

public sealed class ClassMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClassId { get; set; }
    public Guid StudentUserId { get; set; }
    public string StudentEmail { get; set; } = string.Empty;
    public DateTime AddedAtUtc { get; set; } = DateTime.UtcNow;
}
