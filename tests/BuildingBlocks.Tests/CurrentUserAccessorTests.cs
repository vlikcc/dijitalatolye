using System.Security.Claims;
using DijitalAtolye.BuildingBlocks.Authentication;
using FluentAssertions;
using Microsoft.AspNetCore.Http;

namespace DijitalAtolye.BuildingBlocks.Tests;

public sealed class CurrentUserAccessorTests
{
    [Fact]
    public void Roles_reads_jwt_role_claim_when_MapInboundClaims_disabled()
    {
        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("sub", Guid.NewGuid().ToString()),
            new Claim("role", "Admin"),
            new Claim("role", "Teacher"),
        ], authenticationType: "Bearer"));

        var accessor = new HttpContextAccessor { HttpContext = httpContext };
        var current = new CurrentUserAccessor(accessor);

        current.Roles.Should().BeEquivalentTo(["Admin", "Teacher"]);
        current.IsInRole("Admin").Should().BeTrue();
    }
}
