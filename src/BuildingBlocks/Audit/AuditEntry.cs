namespace DijitalAtolye.BuildingBlocks.Audit;

public sealed class AuditEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public string ServiceName { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? CorrelationId { get; set; }
    public string? PayloadJson { get; set; }
    public string Severity { get; set; } = "Info";
}

public static class AuditActions
{
    public const string Login = "user.login";
    public const string Logout = "user.logout";
    public const string Register = "user.register";
    public const string PasswordChanged = "user.password_changed";
    public const string RoleChanged = "user.role_changed";
    public const string ContentCreated = "content.created";
    public const string ContentSubmitted = "content.submitted";
    public const string ContentPublished = "content.published";
    public const string ContentRejected = "content.rejected";
    public const string ContentDeleted = "content.deleted";
    public const string ReviewDecision = "review.decision";
    public const string AdminAction = "admin.action";
    public const string DataExport = "kvkk.data_export";
    public const string DataDeletion = "kvkk.data_deletion";
}
