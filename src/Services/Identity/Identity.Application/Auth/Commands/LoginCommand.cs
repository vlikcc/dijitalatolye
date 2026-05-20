using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.Common.Errors;
using DijitalAtolye.BuildingBlocks.Common.Results;
using DijitalAtolye.Identity.Application.Auth.Tokens;
using DijitalAtolye.Identity.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace DijitalAtolye.Identity.Application.Auth.Commands;

public sealed record LoginCommand(
    string Email,
    string Password,
    string? IpAddress,
    string? TwoFactorCode = null) : IRequest<Result<TokenPair>>;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, Result<TokenPair>>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ITokenIssuer _tokenIssuer;

    public LoginCommandHandler(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ITokenIssuer tokenIssuer)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenIssuer = tokenIssuer;
    }

    public async Task<Result<TokenPair>> Handle(LoginCommand command, CancellationToken ct)
    {
        var user = await _userManager.FindByEmailAsync(command.Email);
        if (user is null)
        {
            return CommonErrors.Unauthorized();
        }

        if (user.IsLocked || await _userManager.IsLockedOutAsync(user))
        {
            return Error.Forbidden("auth.locked", "Hesabınız kilitli. Daha sonra tekrar deneyin.");
        }

        var signIn = await _signInManager.CheckPasswordSignInAsync(user, command.Password, lockoutOnFailure: true);
        if (!signIn.Succeeded)
        {
            return CommonErrors.Unauthorized();
        }

        var roles = await _userManager.GetRolesAsync(user);
        var requiresTwoFactor = user.TwoFactorEnabled &&
            roles.Any(r => string.Equals(r, Roles.Admin, StringComparison.OrdinalIgnoreCase) ||
                           string.Equals(r, Roles.SuperAdmin, StringComparison.OrdinalIgnoreCase));

        var mfaVerified = false;
        if (requiresTwoFactor)
        {
            if (string.IsNullOrWhiteSpace(command.TwoFactorCode))
            {
                return Error.Unauthorized(
                    "auth.2fa_required",
                    "İki faktörlü doğrulama kodu gereklidir.");
            }

            var valid = await _userManager.VerifyTwoFactorTokenAsync(
                user,
                TokenOptions.DefaultAuthenticatorProvider,
                command.TwoFactorCode);
            if (!valid)
            {
                return Error.Validation("auth.2fa_invalid", "Doğrulama kodu geçersiz.");
            }

            mfaVerified = true;
        }

        user.LastLoginAtUtc = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var pair = await _tokenIssuer.IssueAsync(user, roles, command.IpAddress, mfaVerified, ct);
        return pair;
    }
}
