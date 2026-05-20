using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace DijitalAtolye.BuildingBlocks.Authentication;

public static class JwtAuthExtensions
{
    /// <summary>
    /// Tüm servisler için ortak JWT validation. Identity Service'in public key endpoint'inden
    /// (JWKS) anahtarları okur. Lokal geliştirmede SymmetricKey ile başlayabilir.
    /// </summary>
    public static IServiceCollection AddDijitalAtolyeJwtAuth(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var options = configuration.GetSection("Jwt").Get<JwtOptions>()
            ?? throw new InvalidOperationException("Jwt configuration section is missing.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, jwt =>
            {
                jwt.Audience = options.Audience;
                jwt.RequireHttpsMetadata = options.RequireHttpsMetadata;
                // Token'daki "role" / "name" / "sub" claim'leri olduklari gibi kalsin;
                // aksi halde varsayilan harita ClaimTypes.Role'e cevirir ve RoleClaimType="role" ile catisir.
                jwt.MapInboundClaims = false;

                var validationParams = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = options.Authority,
                    ValidateAudience = true,
                    ValidAudience = options.Audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromSeconds(30),
                    RoleClaimType = "role",
                    NameClaimType = "name",
                };

                // HS256 paylasilan anahtar (Jwt:SigningKey) varsa onu kullan; aksi halde
                // OIDC keşfini (Authority) kullan (RS256/JWKS senaryolari icin).
                if (!string.IsNullOrWhiteSpace(options.SigningKey))
                {
                    validationParams.ValidateIssuerSigningKey = true;
                    validationParams.IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(options.SigningKey));
                }
                else
                {
                    jwt.Authority = options.Authority;
                }

                jwt.TokenValidationParameters = validationParams;
            });

        services.AddAuthorization(authz =>
        {
            authz.AddPolicy(Policies.TeacherOrAbove, p => p.RequireRole(
                Roles.Teacher, Roles.Editor, Roles.Admin, Roles.SuperAdmin));

            authz.AddPolicy(Policies.EditorOrAbove, p => p.RequireRole(
                Roles.Editor, Roles.Admin, Roles.SuperAdmin));

            authz.AddPolicy(Policies.AdminOnly, p => p.RequireRole(
                Roles.Admin, Roles.SuperAdmin));

            authz.AddPolicy(Policies.RequireTwoFactorForAdmin, p =>
            {
                p.RequireRole(Roles.Admin, Roles.SuperAdmin);
                p.RequireClaim("mfa", "true");
            });
        });

        return services;
    }
}

public sealed class JwtOptions
{
    public string Authority { get; init; } = string.Empty;
    public string Audience { get; init; } = "dijitalatolye-api";
    public bool RequireHttpsMetadata { get; init; } = true;
    public string SigningKey { get; init; } = string.Empty;
}
