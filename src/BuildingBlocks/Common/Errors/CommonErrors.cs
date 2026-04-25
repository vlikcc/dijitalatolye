using DijitalAtolye.BuildingBlocks.Common.Results;

namespace DijitalAtolye.BuildingBlocks.Common.Errors;

/// <summary>
/// Tüm servislerde kullanılabilecek genel hata tanımları. Servise özgü hatalar
/// kendi <c>Domain.Errors</c> namespace'inde tanımlanmalı.
/// </summary>
public static class CommonErrors
{
    public static Error Unauthorized() =>
        Error.Unauthorized("auth.unauthorized", "Bu işlem için kimlik doğrulaması gereklidir.");

    public static Error Forbidden() =>
        Error.Forbidden("auth.forbidden", "Bu işlem için yetkiniz yok.");

    public static Error NotFound(string resource, object key) =>
        Error.NotFound($"{resource}.notfound", $"{resource} bulunamadı: {key}");

    public static Error ValidationFailed(string field, string message) =>
        Error.Validation($"validation.{field}", message);

    public static Error Conflict(string code, string message) =>
        Error.Conflict(code, message);

    public static Error Unexpected(string operation) =>
        Error.Unexpected("system.unexpected", $"Beklenmeyen bir hata oluştu: {operation}");
}
