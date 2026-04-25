namespace DijitalAtolye.User.API.Domain;

public sealed class UserProfile
{
    public required Guid UserId { get; init; }
    public required string Email { get; init; }
    public string DisplayName { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
    public string? Subject { get; set; }
    public string? SchoolName { get; set; }
    public string? City { get; set; }
    public string PrimaryRole { get; set; } = "Student";
    public TeacherVerificationStatus TeacherVerification { get; set; } = TeacherVerificationStatus.NotRequested;
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
}

public enum TeacherVerificationStatus
{
    NotRequested = 0,
    PendingMebEmail = 1,
    PendingManualReview = 2,
    Verified = 3,
    Rejected = 4,
}
