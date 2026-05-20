using DijitalAtolye.BuildingBlocks.Common.Errors;
using DijitalAtolye.BuildingBlocks.Common.Results;
using DijitalAtolye.Identity.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using System.Text.Encodings.Web;

namespace DijitalAtolye.Identity.Application.Auth.Commands;

public sealed record SetupTwoFactorCommand(Guid UserId) : IRequest<Result<TwoFactorSetupResult>>;

public sealed record TwoFactorSetupResult(string SharedKey, string AuthenticatorUri);

public sealed class SetupTwoFactorCommandHandler : IRequestHandler<SetupTwoFactorCommand, Result<TwoFactorSetupResult>>
{
    private const string AuthenticatorIssuer = "DijitalAtolye";

    private readonly UserManager<ApplicationUser> _userManager;

    public SetupTwoFactorCommandHandler(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<Result<TwoFactorSetupResult>> Handle(SetupTwoFactorCommand command, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(command.UserId.ToString());
        if (user is null)
        {
            return CommonErrors.NotFound("User", command.UserId);
        }

        await _userManager.ResetAuthenticatorKeyAsync(user);
        var key = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrWhiteSpace(key))
        {
            return CommonErrors.Unexpected("2FA kurulum anahtarı üretilemedi.");
        }

        var uri = GenerateAuthenticatorUri(user.Email ?? user.UserName ?? user.Id.ToString("D"), key);
        return new TwoFactorSetupResult(key, uri);
    }

    private static string GenerateAuthenticatorUri(string email, string unformattedKey)
    {
        const string authenticatorUriFormat =
            "otpauth://totp/{0}:{1}?secret={2}&issuer={0}&digits=6";

        return string.Format(
            authenticatorUriFormat,
            UrlEncoder.Default.Encode(AuthenticatorIssuer),
            UrlEncoder.Default.Encode(email),
            unformattedKey);
    }
}
