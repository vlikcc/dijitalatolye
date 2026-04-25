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
                jwt.Authority = options.Authority;
                jwt.Audience = options.Audience;
                jwt.RequireHttpsMetadata = options.RequireHttpsMetadata;
                jwt.TokenValidationParameters = new TokenValidationParameters
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
            });

        services.AddAuthorization(authz =>
        {
            authz.AddPolicy(Policies.TeacherOrAbove, p => p.RequireRole(
                Roles.Teacher, Roles.Editor, Roles.Admin, Roles.SuperAdmin));

            authz.AddPolicy(Policies.EditorOrAbove, p => p.RequireRole(
                Roles.Editor, Roles.Admin, Roles.SuperAdmin));

            authz.AddPolicy(Policies.AdminOnly, p => p.RequireRole(
                Roles.Admin, Roles.SuperAdmin));
        });

        return services;
    }
}

public sealed class JwtOptions
{
    public string Authority { get; init; } = string.Empty;
    public string Audience { get; init; } = "dijitalatolye-api";
    public bool RequireHttpsMetadata { get; init; } = true;
}
