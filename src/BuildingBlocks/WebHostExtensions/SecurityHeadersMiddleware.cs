using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace DijitalAtolye.BuildingBlocks.WebHostExtensions;

public static class SecurityHeadersExtensions
{
    /// <summary>
    /// Tum HTTP yanitlarina temel guvenlik baslıklarını ekler. KVKK ve OWASP onerilerine
    /// uygun makul varsayilanlar saglar. CSP ozellikle sandboxed iframe icin sıkı olmalı,
    /// gateway/web tarafında sıkilastırılır.
    /// </summary>
    public static IApplicationBuilder UseDijitalAtolyeSecurityHeaders(
        this IApplicationBuilder app,
        SecurityHeadersOptions? options = null)
    {
        var opts = options ?? new SecurityHeadersOptions();
        return app.Use(async (ctx, next) =>
        {
            var headers = ctx.Response.Headers;
            headers["X-Content-Type-Options"] = "nosniff";
            headers["X-Frame-Options"] = opts.FrameOptions;
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";
            headers["X-XSS-Protection"] = "0";
            headers["Cross-Origin-Opener-Policy"] = "same-origin";
            headers["Cross-Origin-Resource-Policy"] = "same-site";
            if (!string.IsNullOrWhiteSpace(opts.ContentSecurityPolicy))
            {
                headers["Content-Security-Policy"] = opts.ContentSecurityPolicy;
            }
            if (opts.EnableHsts && ctx.Request.IsHttps)
            {
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
            }
            await next(ctx).ConfigureAwait(false);
        });
    }
}

public sealed class SecurityHeadersOptions
{
    public string FrameOptions { get; init; } = "DENY";
    public string? ContentSecurityPolicy { get; init; }
    public bool EnableHsts { get; init; } = true;
}
