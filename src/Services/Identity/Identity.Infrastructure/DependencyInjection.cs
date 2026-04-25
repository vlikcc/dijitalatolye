using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.Identity.Application.Auth.Tokens;
using DijitalAtolye.Identity.Domain.Entities;
using DijitalAtolye.Identity.Infrastructure.Auth;
using DijitalAtolye.Identity.Infrastructure.Persistence;
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

        services.AddAuthentication();
        services.AddDataProtection();

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
            })
            .AddRoles<ApplicationRole>()
            .AddSignInManager()
            .AddEntityFrameworkStores<IdentityDbContext>()
            .AddDefaultTokenProviders();

        services.Configure<JwtIssuerOptions>(configuration.GetSection("JwtIssuer"));
        services.AddScoped<ITokenIssuer, JwtTokenIssuer>();
        services.AddScoped<IOutboxWriter, EfCoreOutboxWriter<IdentityDbContext>>();
        services.AddHostedService<OutboxDispatcher<IdentityDbContext>>();

        return services;
    }
}
