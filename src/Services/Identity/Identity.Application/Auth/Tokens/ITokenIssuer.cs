using DijitalAtolye.Identity.Domain.Entities;

namespace DijitalAtolye.Identity.Application.Auth.Tokens;

public interface ITokenIssuer
{
    Task<TokenPair> IssueAsync(
        ApplicationUser user,
        IEnumerable<string> roles,
        string? ipAddress,
        bool mfaVerified = false,
        CancellationToken ct = default);

    Task<TokenPair?> RefreshAsync(string refreshToken, string? ipAddress, CancellationToken ct);
}

public sealed record TokenPair(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAtUtc,
    DateTime RefreshTokenExpiresAtUtc,
    IReadOnlyList<string> Roles);
