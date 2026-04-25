using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace DijitalAtolye.BuildingBlocks.Authentication;

/// <summary>
/// Application katmanı için authenticated user soyutlaması. HTTP Context'e doğrudan
/// erişimi engeller; test edilebilirliği artırır.
/// </summary>
public interface ICurrentUser
{
    Guid? UserId { get; }
    string? Email { get; }
    string? DisplayName { get; }
    bool IsAuthenticated { get; }
    IReadOnlyCollection<string> Roles { get; }
    bool IsInRole(string role);
}

public sealed class CurrentUserAccessor : ICurrentUser
{
    private readonly IHttpContextAccessor _accessor;

    public CurrentUserAccessor(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public bool IsAuthenticated => _accessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

    public Guid? UserId
    {
        get
        {
            var sub = _accessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? _accessor.HttpContext?.User?.FindFirstValue("sub");
            return Guid.TryParse(sub, out var id) ? id : null;
        }
    }

    public string? Email => _accessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email);

    public string? DisplayName => _accessor.HttpContext?.User?.FindFirstValue("name");

    public IReadOnlyCollection<string> Roles =>
        _accessor.HttpContext?.User?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToArray() ?? [];

    public bool IsInRole(string role) => _accessor.HttpContext?.User?.IsInRole(role) ?? false;
}
