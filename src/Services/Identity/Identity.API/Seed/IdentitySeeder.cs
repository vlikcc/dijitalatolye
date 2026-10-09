using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.Identity.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace DijitalAtolye.Identity.API.Seed;

/// <summary>
/// Varsayılan rolleri ve (yapılandırılmışsa) ilk admin kullanıcısını oluşturur.
/// Development dışında admin yalnızca <c>Seed:AdminEmail</c> + <c>Seed:AdminPassword</c> verilirse oluşturulur;
/// eski kurulumlardan kalan varsayılan şifreli hesap kilitlenir.
/// </summary>
public static class IdentitySeeder
{
    private const string DevAdminEmail = "admin@dijitalatolye.local";
    private const string DevAdminPassword = "Admin123!";
    private const int MinProdAdminPasswordLength = 12;

    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var config = services.GetRequiredService<IConfiguration>();
        var env = services.GetRequiredService<IHostEnvironment>();
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger(typeof(IdentitySeeder));

        foreach (var role in new[] { Roles.Student, Roles.Teacher, Roles.Editor, Roles.Admin, Roles.SuperAdmin })
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new ApplicationRole(role));
            }
        }

        var isDev = env.IsDevelopment() || env.IsEnvironment("Testing");
        var adminEmail = NullIfEmpty(config["Seed:AdminEmail"]) ?? (isDev ? DevAdminEmail : null);
        var adminPassword = NullIfEmpty(config["Seed:AdminPassword"]) ?? (isDev ? DevAdminPassword : null);

        if (!isDev)
        {
            await DisarmDefaultAdminAsync(userManager, adminEmail, adminPassword, logger);
            if (adminEmail is null || adminPassword is null)
            {
                logger.LogInformation("Seed:AdminEmail / Seed:AdminPassword verilmedi; admin seed atlandı.");
                return;
            }
            if (adminPassword.Length < MinProdAdminPasswordLength || adminPassword == DevAdminPassword)
            {
                throw new InvalidOperationException(
                    $"Seed:AdminPassword production için en az {MinProdAdminPasswordLength} karakter olmalı ve varsayılan şifre olmamalı.");
            }
        }

        var admin = await userManager.FindByEmailAsync(adminEmail!);
        if (admin is null)
        {
            admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                DisplayName = "DijitalAtolye Admin",
                EmailConfirmed = true,
                MebEmailVerified = true,
            };
            var created = await userManager.CreateAsync(admin, adminPassword!);
            if (!created.Succeeded)
            {
                throw new InvalidOperationException(
                    "Admin seed başarısız: " + string.Join("; ", created.Errors.Select(e => e.Description)));
            }
            await userManager.AddToRolesAsync(admin, [Roles.Admin, Roles.SuperAdmin, Roles.Editor, Roles.Teacher]);
            logger.LogInformation("İlk admin kullanıcısı oluşturuldu.");
        }
    }

    /// <summary>
    /// Önceki sürümler production'da da <c>admin@dijitalatolye.local / Admin123!</c> seed ediyordu.
    /// Bu hesap hâlâ varsayılan şifreyle duruyorsa: aynı e-posta için yeni şifre verilmişse şifre değiştirilir,
    /// aksi halde hesap kilitlenir.
    /// </summary>
    private static async Task DisarmDefaultAdminAsync(
        UserManager<ApplicationUser> userManager, string? adminEmail, string? adminPassword, ILogger logger)
    {
        var legacy = await userManager.FindByEmailAsync(DevAdminEmail);
        if (legacy is null || !await userManager.CheckPasswordAsync(legacy, DevAdminPassword))
        {
            return;
        }

        if (string.Equals(adminEmail, DevAdminEmail, StringComparison.OrdinalIgnoreCase)
            && adminPassword is { Length: >= MinProdAdminPasswordLength } && adminPassword != DevAdminPassword)
        {
            var token = await userManager.GeneratePasswordResetTokenAsync(legacy);
            var reset = await userManager.ResetPasswordAsync(legacy, token, adminPassword);
            if (reset.Succeeded)
            {
                // Önceki bir açılışta (seed verilmeden) kilitlenmiş olabilir.
                await userManager.SetLockoutEndDateAsync(legacy, null);
                await userManager.ResetAccessFailedCountAsync(legacy);
                logger.LogWarning("Varsayılan admin şifresi Seed:AdminPassword ile değiştirildi.");
                return;
            }
        }

        await userManager.SetLockoutEnabledAsync(legacy, true);
        await userManager.SetLockoutEndDateAsync(legacy, DateTimeOffset.MaxValue);
        await userManager.UpdateSecurityStampAsync(legacy);
        logger.LogCritical(
            "Varsayılan şifreli admin hesabı ({Email}) güvenlik nedeniyle kilitlendi. " +
            "Seed__AdminEmail={Email} ve güçlü bir Seed__AdminPassword vererek yeniden başlatın.",
            DevAdminEmail, DevAdminEmail);
    }

    private static string? NullIfEmpty(string? value) => string.IsNullOrWhiteSpace(value) ? null : value;
}
