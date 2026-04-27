using DijitalAtolye.BuildingBlocks.Audit;
using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.Identity.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Identity.API.Endpoints;

/// <summary>
/// Admin paneli için kullanıcı / rol yönetim uçları. Tüm uçlar <see cref="Policies.AdminOnly"/>
/// gerektirir. Admin'in atayabileceği roller <see cref="ManageableRoles"/> ile sınırlıdır;
/// SuperAdmin ve Admin rolleri yalnızca seed üzerinden atanır (yetki tırmanmasını engellemek için).
/// Editör rolü yalnızca <see cref="Roles.Teacher"/> olan hesaplara atanabilir.
/// </summary>
public static class AdminUserEndpoints
{
    private static readonly HashSet<string> ManageableRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        Roles.Editor,
        Roles.Teacher,
    };

    public static IEndpointRouteBuilder MapAdminUserEndpoints(this IEndpointRouteBuilder routes)
    {
        var grp = routes.MapGroup("/admin/users")
            .WithTags("AdminUsers")
            .RequireAuthorization(Policies.AdminOnly);

        grp.MapGet("", ListAsync)
            .Produces<List<UserRowDto>>();

        grp.MapPost("/{id:guid}/roles/grant", GrantAsync)
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);

        grp.MapPost("/{id:guid}/roles/revoke", RevokeAsync)
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return routes;
    }

    private static async Task<IResult> ListAsync(
        [FromQuery] string? q,
        [FromQuery] string? role,
        [FromServices] UserManager<ApplicationUser> userManager,
        CancellationToken ct)
    {
        var query = userManager.Users.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var like = $"%{q.Trim()}%";
            query = query.Where(u =>
                EF.Functions.ILike(u.Email!, like) ||
                EF.Functions.ILike(u.DisplayName, like));
        }

        var users = await query
            .OrderByDescending(u => u.CreatedAtUtc)
            .Take(200)
            .ToListAsync(ct)
            .ConfigureAwait(false);

        var rows = new List<UserRowDto>(users.Count);
        foreach (var u in users)
        {
            var rs = await userManager.GetRolesAsync(u).ConfigureAwait(false);
            if (!string.IsNullOrWhiteSpace(role) &&
                !rs.Contains(role!, StringComparer.OrdinalIgnoreCase))
            {
                continue;
            }
            rows.Add(new UserRowDto(
                Id: u.Id.ToString(),
                Email: u.Email ?? string.Empty,
                DisplayName: u.DisplayName,
                Roles: rs.ToArray(),
                IsVerified: u.EmailConfirmed,
                MebVerified: u.MebEmailVerified,
                CreatedAt: u.CreatedAtUtc));
        }
        return Results.Json(rows);
    }

    private static async Task<IResult> GrantAsync(
        Guid id,
        [FromBody] RoleChangeRequest body,
        [FromServices] UserManager<ApplicationUser> userManager,
        [FromServices] IAuditLogger audit,
        ICurrentUser current,
        CancellationToken ct)
    {
        if (!IsManageable(body.Role))
        {
            return Results.Problem(
                title: "Geçersiz rol",
                detail: $"Yalnızca şu roller atanabilir: {string.Join(", ", ManageableRoles)}",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var user = await userManager.FindByIdAsync(id.ToString()).ConfigureAwait(false);
        if (user is null) return Results.NotFound();

        if (string.Equals(body.Role, Roles.Editor, StringComparison.OrdinalIgnoreCase) &&
            !await userManager.IsInRoleAsync(user, Roles.Teacher).ConfigureAwait(false))
        {
            return Results.Problem(
                title: "Uygun değil",
                detail: "Editör rolü yalnızca Öğretmen rolündeki kullanıcılara atanabilir.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        if (await userManager.IsInRoleAsync(user, body.Role).ConfigureAwait(false))
        {
            return Results.NoContent();
        }

        var result = await userManager.AddToRoleAsync(user, body.Role).ConfigureAwait(false);
        if (!result.Succeeded)
        {
            return Results.Problem(
                title: "Rol atanamadı",
                detail: string.Join("; ", result.Errors.Select(e => e.Description)),
                statusCode: StatusCodes.Status400BadRequest);
        }

        await audit.LogAsync(
            action: AuditActions.RoleChanged,
            entityType: "User",
            entityId: id.ToString(),
            payload: new { change = "grant", role = body.Role, by = current.UserId },
            severity: "Info",
            ct: ct).ConfigureAwait(false);
        return Results.NoContent();
    }

    private static async Task<IResult> RevokeAsync(
        Guid id,
        [FromBody] RoleChangeRequest body,
        [FromServices] UserManager<ApplicationUser> userManager,
        [FromServices] IAuditLogger audit,
        ICurrentUser current,
        CancellationToken ct)
    {
        if (!IsManageable(body.Role))
        {
            return Results.Problem(
                title: "Geçersiz rol",
                detail: $"Yalnızca şu roller alınabilir: {string.Join(", ", ManageableRoles)}",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var user = await userManager.FindByIdAsync(id.ToString()).ConfigureAwait(false);
        if (user is null) return Results.NotFound();
        if (!await userManager.IsInRoleAsync(user, body.Role).ConfigureAwait(false))
        {
            return Results.NoContent();
        }

        var result = await userManager.RemoveFromRoleAsync(user, body.Role).ConfigureAwait(false);
        if (!result.Succeeded)
        {
            return Results.Problem(
                title: "Rol kaldırılamadı",
                detail: string.Join("; ", result.Errors.Select(e => e.Description)),
                statusCode: StatusCodes.Status400BadRequest);
        }

        await audit.LogAsync(
            action: AuditActions.RoleChanged,
            entityType: "User",
            entityId: id.ToString(),
            payload: new { change = "revoke", role = body.Role, by = current.UserId },
            severity: "Info",
            ct: ct).ConfigureAwait(false);
        return Results.NoContent();
    }

    private static bool IsManageable(string? role) =>
        !string.IsNullOrWhiteSpace(role) && ManageableRoles.Contains(role);
}

public sealed record UserRowDto(
    string Id,
    string Email,
    string DisplayName,
    string[] Roles,
    bool IsVerified,
    bool MebVerified,
    DateTime CreatedAt);

public sealed record RoleChangeRequest(string Role);
