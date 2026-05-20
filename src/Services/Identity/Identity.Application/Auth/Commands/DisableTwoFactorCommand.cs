using DijitalAtolye.BuildingBlocks.Common.Errors;
using DijitalAtolye.BuildingBlocks.Common.Results;
using DijitalAtolye.Identity.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace DijitalAtolye.Identity.Application.Auth.Commands;

public sealed record DisableTwoFactorCommand(Guid UserId, string Password, string Code) : IRequest<Result<Unit>>;

public sealed class DisableTwoFactorCommandValidator : AbstractValidator<DisableTwoFactorCommand>
{
    public DisableTwoFactorCommandValidator()
    {
        RuleFor(x => x.Password).NotEmpty();
        RuleFor(x => x.Code).NotEmpty().Length(6, 8);
    }
}

public sealed class DisableTwoFactorCommandHandler : IRequestHandler<DisableTwoFactorCommand, Result<Unit>>
{
    private readonly UserManager<ApplicationUser> _userManager;

    public DisableTwoFactorCommandHandler(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<Result<Unit>> Handle(DisableTwoFactorCommand command, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(command.UserId.ToString());
        if (user is null)
        {
            return CommonErrors.NotFound("User", command.UserId);
        }

        if (!user.TwoFactorEnabled)
        {
            return Unit.Value;
        }

        if (!await _userManager.CheckPasswordAsync(user, command.Password))
        {
            return CommonErrors.Unauthorized();
        }

        var valid = await _userManager.VerifyTwoFactorTokenAsync(
            user,
            TokenOptions.DefaultAuthenticatorProvider,
            command.Code);
        if (!valid)
        {
            return Error.Validation("auth.2fa_invalid", "Doğrulama kodu geçersiz.");
        }

        await _userManager.SetTwoFactorEnabledAsync(user, false);
        await _userManager.ResetAuthenticatorKeyAsync(user);
        return Unit.Value;
    }
}
