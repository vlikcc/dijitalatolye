using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.Identity.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace DijitalAtolye.Identity.API.Seed;

/// <summary>
/// Lokal geliştirme için varsayılan rolleri ve admin kullanıcısını oluşturur.
/// Production'da kullanılmaz.
/// </summary>
public static class IdentitySeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

        foreach (var role in new[] { Roles.Student, Roles.Teacher, Roles.Editor, Roles.Admin, Roles.SuperAdmin })
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new ApplicationRole(role));
            }
        }

        const string adminEmail = "admin@dijitalatolye.local";
        var admin = await userManager.FindByEmailAsync(adminEmail);
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
            await userManager.CreateAsync(admin, "Admin123!");
            await userManager.AddToRolesAsync(admin, [Roles.Admin, Roles.SuperAdmin, Roles.Editor, Roles.Teacher]);
        }
    }
}
