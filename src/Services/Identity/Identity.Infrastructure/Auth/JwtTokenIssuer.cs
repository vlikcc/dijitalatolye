using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using DijitalAtolye.Identity.Application.Auth.Tokens;
using DijitalAtolye.Identity.Domain.Entities;
using DijitalAtolye.Identity.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace DijitalAtolye.Identity.Infrastructure.Auth;

public sealed class JwtTokenIssuer : ITokenIssuer
{
    private readonly IdentityDbContext _db;
    private readonly JwtIssuerOptions _options;

    public JwtTokenIssuer(IdentityDbContext db, IOptions<JwtIssuerOptions> options)
    {
        _db = db;
        _options = options.Value;
    }

    public async Task<TokenPair> IssueAsync(
        ApplicationUser user,
        IEnumerable<string> roles,
        string? ipAddress,
        bool mfaVerified = false,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var accessExpiresAt = now.Add(_options.AccessTokenLifetime);
        var refreshExpiresAt = now.Add(_options.RefreshTokenLifetime);

        var accessToken = CreateAccessToken(user, roles, now, accessExpiresAt, mfaVerified);
        var refreshTokenRaw = GenerateRefreshTokenRaw();
        var refreshTokenHash = HashRefreshToken(refreshTokenRaw);

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            CreatedAtUtc = now,
            ExpiresAtUtc = refreshExpiresAt,
            CreatedByIp = ipAddress,
        });
        await _db.SaveChangesAsync(ct);

        var roleList = roles as IReadOnlyList<string> ?? roles.ToList();
        return new TokenPair(accessToken, refreshTokenRaw, accessExpiresAt, refreshExpiresAt, roleList);
    }

    public async Task<TokenPair?> RefreshAsync(string refreshToken, string? ipAddress, CancellationToken ct)
    {
        var hash = HashRefreshToken(refreshToken);
        var stored = await _db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (stored is null || !stored.IsActive)
        {
            return null;
        }

        var now = DateTime.UtcNow;
        var accessExpiresAt = now.Add(_options.AccessTokenLifetime);
        var refreshExpiresAt = now.Add(_options.RefreshTokenLifetime);

        var newRaw = GenerateRefreshTokenRaw();
        var newHash = HashRefreshToken(newRaw);
        stored.RevokedAtUtc = now;
        stored.ReplacedByTokenHash = newHash;

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = stored.UserId,
            TokenHash = newHash,
            CreatedAtUtc = now,
            ExpiresAtUtc = refreshExpiresAt,
            CreatedByIp = ipAddress,
        });

        var roles = await _db.UserRoles.Where(r => r.UserId == stored.UserId)
            .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (_, r) => r.Name!)
            .ToListAsync(ct);

        var accessToken = CreateAccessToken(stored.User, roles, now, accessExpiresAt, mfaVerified: false);
        await _db.SaveChangesAsync(ct);

        return new TokenPair(accessToken, newRaw, accessExpiresAt, refreshExpiresAt, roles);
    }

    private string CreateAccessToken(
        ApplicationUser user,
        IEnumerable<string> roles,
        DateTime issuedAt,
        DateTime expiresAt,
        bool mfaVerified)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString("D")),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new("name", user.DisplayName),
        };
        claims.AddRange(roles.Select(r => new Claim("role", r)));
        if (mfaVerified)
        {
            claims.Add(new Claim("mfa", "true"));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var jwt = new JwtSecurityToken(
            issuer: _options.Authority,
            audience: _options.Audience,
            claims: claims,
            notBefore: issuedAt,
            expires: expiresAt,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(jwt);
    }

    private static string GenerateRefreshTokenRaw()
    {
        Span<byte> bytes = stackalloc byte[64];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }

    private static string HashRefreshToken(string raw) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)));
}

public sealed class JwtIssuerOptions
{
    public string Authority { get; init; } = "http://localhost:5001";
    public string Audience { get; init; } = "dijitalatolye-api";
    public string SigningKey { get; init; } = string.Empty;
    public TimeSpan AccessTokenLifetime { get; init; } = TimeSpan.FromMinutes(60);
    public TimeSpan RefreshTokenLifetime { get; init; } = TimeSpan.FromDays(14);
}
