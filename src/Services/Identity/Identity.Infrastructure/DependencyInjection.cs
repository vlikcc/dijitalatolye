using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.Identity.Application.Auth.Services;
using DijitalAtolye.Identity.Application.Auth.Tokens;
using DijitalAtolye.Identity.Domain.Entities;
using DijitalAtolye.Identity.Infrastructure.Auth;
using DijitalAtolye.Identity.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DijitalAtolye.Identity.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddIdentityInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<IdentityDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("Postgres")
                ?? throw new InvalidOperationException("Postgres connection string missing")));

        // Doğrulama / şifre sıfırlama token'ları DataProtection anahtarlarıyla imzalanır; anahtarlar kalıcı
        // değilse her container yeniden başlatmasında gönderilmiş tüm linkler geçersiz olur.
        var dataProtection = services.AddDataProtection().SetApplicationName("dijitalatolye-identity");
        var keysPath = configuration["DataProtection:KeysPath"];
        if (!string.IsNullOrWhiteSpace(keysPath))
        {
            dataProtection.PersistKeysToFileSystem(new DirectoryInfo(keysPath));
        }

        services.AddIdentityCore<ApplicationUser>(opt =>
            {
                opt.User.RequireUniqueEmail = true;
                opt.Password.RequiredLength = 8;
                opt.Password.RequireUppercase = true;
                opt.Password.RequireLowercase = true;
                opt.Password.RequireDigit = true;
                opt.Password.RequireNonAlphanumeric = false;
                opt.Lockout.MaxFailedAccessAttempts = 5;
                opt.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                opt.SignIn.RequireConfirmedEmail = false; // V1: e-posta dogrulama tetiklenir ama login engellenmez
                opt.Tokens.AuthenticatorTokenProvider = TokenOptions.DefaultAuthenticatorProvider;
            })
            .AddRoles<ApplicationRole>()
            .AddSignInManager()
            .AddEntityFrameworkStores<IdentityDbContext>()
            .AddDefaultTokenProviders()
            .AddTokenProvider<AuthenticatorTokenProvider<ApplicationUser>>(
                TokenOptions.DefaultAuthenticatorProvider);

        services.Configure<JwtIssuerOptions>(configuration.GetSection("JwtIssuer"));
        services.AddScoped<ITokenIssuer, JwtTokenIssuer>();
        services.AddScoped<IPasswordResetNotifier, OutboxPasswordResetNotifier>();
        services.AddScoped<IOutboxWriter, AutoSavingOutboxWriter>();
        services.AddHostedService<OutboxDispatcher<IdentityDbContext>>();

        return services;
    }

    /// <summary>
    /// Google OAuth handler'ını mevcut authentication pipeline'a ekler.
    /// ClientId/Secret yoksa social login devre dışı kalır.
    /// </summary>
    public static IServiceCollection AddIdentityGoogleAuth(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var clientId = configuration["OAuth:Google:ClientId"];
        var clientSecret = configuration["OAuth:Google:ClientSecret"];
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            return services;
        }

        services.AddAuthentication()
            .AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
            {
                options.ClientId = clientId;
                options.ClientSecret = clientSecret;
                options.CallbackPath = "/auth/google/callback";
            });

        return services;
    }
}
