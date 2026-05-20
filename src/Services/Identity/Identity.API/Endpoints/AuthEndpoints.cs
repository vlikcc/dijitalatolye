using System.Security.Claims;
using System.Security.Cryptography;
using DijitalAtolye.BuildingBlocks.Audit;
using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.Common;
using DijitalAtolye.BuildingBlocks.Common.ApiResponses;
using DijitalAtolye.Identity.Application.Auth.Commands;
using DijitalAtolye.Identity.Application.Auth.Tokens;
using DijitalAtolye.Identity.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace DijitalAtolye.Identity.API.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder routes)
    {
        var auth = routes.MapGroup("/auth").WithTags("Auth");

        auth.MapPost("/register", async (
            [FromBody] RegisterUserCommand command,
            [FromServices] IMediator mediator,
            [FromServices] IAuditLogger audit,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(command, ct);
            if (result.IsSuccess)
            {
                await audit.LogAsync(
                    AuditActions.Register,
                    entityType: "User",
                    entityId: result.Value.UserId.ToString(),
                    payload: new { command.Email },
                    ct: ct);
            }
            return result.ToCreatedResult($"/users/{(result.IsSuccess ? result.Value.UserId : Guid.Empty)}");
        }).Produces(StatusCodes.Status201Created)
          .ProducesProblem(StatusCodes.Status400BadRequest)
          .ProducesProblem(StatusCodes.Status409Conflict)
          .WithName("Register");

        auth.MapPost("/login", async (
            [FromBody] LoginRequest body,
            HttpContext http,
            [FromServices] IMediator mediator,
            [FromServices] IAuditLogger audit,
            CancellationToken ct) =>
        {
            var ip = http.Connection.RemoteIpAddress?.ToString();
            var result = await mediator.Send(
                new LoginCommand(body.Email, body.Password, ip, body.TwoFactorCode), ct);
            await audit.LogAsync(
                AuditActions.Login,
                entityType: "User",
                payload: new { body.Email, success = result.IsSuccess, ip, twoFactor = !string.IsNullOrWhiteSpace(body.TwoFactorCode) },
                severity: result.IsSuccess ? "Info" : "Warning",
                ct: ct);
            return result.ToHttpResult();
        }).RequireRateLimiting("login")
          .Produces<TokenPair>()
          .ProducesProblem(StatusCodes.Status401Unauthorized)
          .WithName("Login");

        auth.MapPost("/verify-email", async (
            [FromBody] VerifyEmailCommand command,
            [FromServices] IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(command, ct);
            return result.ToHttpResult();
        }).Produces(StatusCodes.Status200OK)
          .ProducesProblem(StatusCodes.Status400BadRequest)
          .WithName("VerifyEmail");

        auth.MapPost("/resend-verification", async (
            [FromBody] ResendVerificationCommand command,
            [FromServices] IMediator mediator,
            CancellationToken ct) =>
        {
            await mediator.Send(command, ct);
            return Results.Ok();
        }).Produces(StatusCodes.Status200OK)
          .WithName("ResendVerification");

        auth.MapPost("/forgot-password", async (
            [FromBody] ForgotPasswordCommand command,
            [FromServices] IMediator mediator,
            [FromServices] IAuditLogger audit,
            CancellationToken ct) =>
        {
            await mediator.Send(command, ct);
            await audit.LogAsync(
                AuditActions.PasswordResetRequested,
                entityType: "User",
                payload: new { command.Email },
                severity: "Info",
                ct: ct);
            return Results.Ok();
        }).Produces(StatusCodes.Status200OK)
          .WithName("ForgotPassword");

        auth.MapPost("/reset-password", async (
            [FromBody] ResetPasswordCommand command,
            [FromServices] IMediator mediator,
            [FromServices] IAuditLogger audit,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(command, ct);
            await audit.LogAsync(
                AuditActions.PasswordReset,
                entityType: "User",
                payload: new { command.Email, success = result.IsSuccess },
                severity: result.IsSuccess ? "Info" : "Warning",
                ct: ct);
            return result.ToHttpResult();
        }).Produces(StatusCodes.Status200OK)
          .ProducesProblem(StatusCodes.Status400BadRequest)
          .WithName("ResetPassword");

        auth.MapPost("/refresh", async (
            [FromBody] RefreshRequest body,
            HttpContext http,
            [FromServices] ITokenIssuer issuer,
            CancellationToken ct) =>
        {
            var ip = http.Connection.RemoteIpAddress?.ToString();
            var pair = await issuer.RefreshAsync(body.RefreshToken, ip, ct);
            return pair is null
                ? Results.Unauthorized()
                : Results.Json(pair);
        }).Produces<TokenPair>()
          .ProducesProblem(StatusCodes.Status401Unauthorized)
          .WithName("Refresh");

        auth.MapGet("/google", (HttpContext http) =>
        {
            var props = new AuthenticationProperties { RedirectUri = "/auth/google/callback" };
            return Results.Challenge(props, [GoogleDefaults.AuthenticationScheme]);
        }).WithName("GoogleLogin");

        auth.MapGet("/google/callback", GoogleCallbackAsync)
            .WithName("GoogleCallback");

        var twoFactor = auth.MapGroup("/2fa").RequireAuthorization();

        twoFactor.MapPost("/setup", async (
            [FromServices] IMediator mediator,
            ICurrentUser current,
            CancellationToken ct) =>
        {
            if (current.UserId is null)
            {
                return Results.Unauthorized();
            }

            var result = await mediator.Send(new SetupTwoFactorCommand(current.UserId.Value), ct);
            return result.ToHttpResult();
        }).Produces<TwoFactorSetupResult>()
          .ProducesProblem(StatusCodes.Status401Unauthorized)
          .WithName("TwoFactorSetup");

        twoFactor.MapPost("/verify", async (
            [FromBody] TwoFactorVerifyRequest body,
            [FromServices] IMediator mediator,
            ICurrentUser current,
            CancellationToken ct) =>
        {
            if (current.UserId is null)
            {
                return Results.Unauthorized();
            }

            var result = await mediator.Send(
                new VerifyTwoFactorSetupCommand(current.UserId.Value, body.Code), ct);
            return result.ToHttpResult();
        }).Produces(StatusCodes.Status200OK)
          .ProducesProblem(StatusCodes.Status400BadRequest)
          .WithName("TwoFactorVerify");

        twoFactor.MapPost("/disable", async (
            [FromBody] TwoFactorDisableRequest body,
            [FromServices] IMediator mediator,
            ICurrentUser current,
            CancellationToken ct) =>
        {
            if (current.UserId is null)
            {
                return Results.Unauthorized();
            }

            var result = await mediator.Send(
                new DisableTwoFactorCommand(current.UserId.Value, body.Password, body.Code), ct);
            return result.ToHttpResult();
        }).Produces(StatusCodes.Status200OK)
          .ProducesProblem(StatusCodes.Status401Unauthorized)
          .WithName("TwoFactorDisable");

        return routes;
    }

    private static async Task<IResult> GoogleCallbackAsync(
        HttpContext http,
        [FromServices] UserManager<ApplicationUser> userManager,
        [FromServices] ITokenIssuer tokenIssuer,
        [FromServices] IAuditLogger audit,
        CancellationToken ct)
    {
        var authResult = await http.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);
        if (!authResult.Succeeded || authResult.Principal is null)
        {
            return Results.Unauthorized();
        }

        var email = authResult.Principal.FindFirstValue(ClaimTypes.Email)
            ?? authResult.Principal.FindFirstValue("email");
        if (string.IsNullOrWhiteSpace(email))
        {
            return Results.Problem(
                title: "Google girişi başarısız",
                detail: "Google hesabından e-posta alınamadı.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var displayName = authResult.Principal.FindFirstValue(ClaimTypes.Name)
            ?? authResult.Principal.FindFirstValue("name")
            ?? email;

        var googleSubject = authResult.Principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? authResult.Principal.FindFirstValue("sub");

        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                DisplayName = displayName,
                EmailConfirmed = true,
            };

            var randomPassword = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
            var create = await userManager.CreateAsync(user, randomPassword);
            if (!create.Succeeded)
            {
                return Results.Problem(
                    title: "Hesap oluşturulamadı",
                    detail: string.Join("; ", create.Errors.Select(e => e.Description)),
                    statusCode: StatusCodes.Status400BadRequest);
            }

            await userManager.AddToRoleAsync(user, Roles.Student);
        }

        if (!string.IsNullOrWhiteSpace(googleSubject))
        {
            var loginInfo = new UserLoginInfo(GoogleDefaults.AuthenticationScheme, googleSubject, "Google");
            if (await userManager.FindByLoginAsync(loginInfo.LoginProvider, loginInfo.ProviderKey) is null)
            {
                await userManager.AddLoginAsync(user, loginInfo);
            }
        }

        user.LastLoginAtUtc = DateTime.UtcNow;
        await userManager.UpdateAsync(user);

        var roles = await userManager.GetRolesAsync(user);
        var ip = http.Connection.RemoteIpAddress?.ToString();
        var pair = await tokenIssuer.IssueAsync(user, roles, ip, mfaVerified: false, ct);

        await audit.LogAsync(
            AuditActions.Login,
            entityType: "User",
            entityId: user.Id.ToString(),
            payload: new { email, provider = "google", ip },
            ct: ct);

        await http.SignOutAsync(GoogleDefaults.AuthenticationScheme);
        return Results.Json(pair);
    }
}

public sealed record LoginRequest(string Email, string Password, string? TwoFactorCode = null);
public sealed record RefreshRequest(string RefreshToken);
public sealed record TwoFactorVerifyRequest(string Code);
public sealed record TwoFactorDisableRequest(string Password, string Code);
