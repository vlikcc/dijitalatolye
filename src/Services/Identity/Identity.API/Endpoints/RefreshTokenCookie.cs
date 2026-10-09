using DijitalAtolye.Identity.Application.Auth.Tokens;

namespace DijitalAtolye.Identity.API.Endpoints;

/// <summary>
/// Refresh token tarayıcıda JavaScript'in okuyamadığı bir çerezde tutulur (HttpOnly) ve yalnızca
/// <c>/api/auth/*</c> isteklerine, yalnızca aynı siteden (SameSite=Strict) gönderilir. Böylece bir XSS
/// açığı uzun ömürlü oturumu çalamaz; access token ise yalnızca SPA'nın belleğinde yaşar.
/// </summary>
internal static class RefreshTokenCookie
{
    public const string Name = "da_rt";

    // Gateway /api/auth/* -> Identity /auth/*; tarayıcının gördüğü yol /api/auth.
    private const string PublicPath = "/api/auth";

    public static void Append(HttpContext http, TokenPair pair)
    {
        http.Response.Cookies.Append(Name, pair.RefreshToken, Options(http, pair.RefreshTokenExpiresAtUtc));
    }

    public static void Delete(HttpContext http)
    {
        http.Response.Cookies.Delete(Name, Options(http, expires: null));
    }

    public static string? Read(HttpContext http) =>
        http.Request.Cookies.TryGetValue(Name, out var value) && !string.IsNullOrWhiteSpace(value) ? value : null;

    /// <summary>Yanıt gövdesi: refresh token gövdede dönmez.</summary>
    public static AuthSessionResponse ToSession(TokenPair pair) =>
        new(pair.AccessToken, pair.AccessTokenExpiresAtUtc, pair.Roles);

    private static CookieOptions Options(HttpContext http, DateTime? expires)
    {
        var env = http.RequestServices.GetRequiredService<IHostEnvironment>();
        return new CookieOptions
        {
            HttpOnly = true,
            // Prod'da her zaman Secure; dev'de http://localhost için yalnızca HTTPS isteklerde.
            Secure = http.Request.IsHttps || !env.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Path = PublicPath,
            Expires = expires is null ? null : new DateTimeOffset(DateTime.SpecifyKind(expires.Value, DateTimeKind.Utc)),
            IsEssential = true,
        };
    }
}

public sealed record AuthSessionResponse(string AccessToken, DateTime AccessTokenExpiresAtUtc, IReadOnlyList<string> Roles);
