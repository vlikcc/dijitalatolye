using DijitalAtolye.BuildingBlocks.Audit;
using DijitalAtolye.BuildingBlocks.Common.ApiResponses;
using DijitalAtolye.Identity.Application.Auth.Commands;
using DijitalAtolye.Identity.Application.Auth.Tokens;
using MediatR;
using Microsoft.AspNetCore.Mvc;

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
            var result = await mediator.Send(new LoginCommand(body.Email, body.Password, ip), ct);
            await audit.LogAsync(
                AuditActions.Login,
                entityType: "User",
                payload: new { body.Email, success = result.IsSuccess, ip },
                severity: result.IsSuccess ? "Info" : "Warning",
                ct: ct);
            return result.ToHttpResult();
        }).Produces<TokenPair>()
          .ProducesProblem(StatusCodes.Status401Unauthorized)
          .WithName("Login");

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
            // Bilgi sızdırmamak için her durumda 200 dön.
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

        return routes;
    }
}

public sealed record LoginRequest(string Email, string Password);
public sealed record RefreshRequest(string RefreshToken);
