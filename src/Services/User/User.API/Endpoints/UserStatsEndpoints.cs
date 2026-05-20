using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.User.API.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.User.API.Endpoints;

public static class UserStatsEndpoints
{
    public static IEndpointRouteBuilder MapUserStatsEndpoints(this IEndpointRouteBuilder routes)
    {
        routes.MapGet("/users/admin/stats", async (UserDbContext db, CancellationToken ct) =>
        {
            var totalUsers = await db.Profiles.CountAsync(ct);
            var teachers = await db.Profiles.CountAsync(p => p.PrimaryRole == "Teacher", ct);
            return Results.Ok(new { totalUsers, teachers });
        }).RequireAuthorization(Policies.AdminOnly).WithTags("Admin");

        return routes;
    }
}
