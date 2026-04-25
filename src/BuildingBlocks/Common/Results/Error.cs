namespace DijitalAtolye.BuildingBlocks.Common.Results;

/// <summary>
/// Domain hatası. Servis sınırlarını geçebilir; kullanıcıya gösterilebilecek
/// güvenli mesajlar içerir. Gizli bilgi (stack trace, secret) içermemeli.
/// </summary>
public sealed record Error(string Code, string Message, ErrorType Type)
{
    public static readonly Error None = new(string.Empty, string.Empty, ErrorType.None);

    public static Error NotFound(string code, string message) => new(code, message, ErrorType.NotFound);

    public static Error Validation(string code, string message) => new(code, message, ErrorType.Validation);

    public static Error Conflict(string code, string message) => new(code, message, ErrorType.Conflict);

    public static Error Unauthorized(string code, string message) => new(code, message, ErrorType.Unauthorized);

    public static Error Forbidden(string code, string message) => new(code, message, ErrorType.Forbidden);

    public static Error Failure(string code, string message) => new(code, message, ErrorType.Failure);

    public static Error Unexpected(string code, string message) => new(code, message, ErrorType.Unexpected);
}

public enum ErrorType
{
    None = 0,
    Validation = 1,
    NotFound = 2,
    Conflict = 3,
    Unauthorized = 4,
    Forbidden = 5,
    Failure = 6,
    Unexpected = 7,
}
