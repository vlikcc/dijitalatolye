using DijitalAtolye.BuildingBlocks.Common.Errors;
using DijitalAtolye.BuildingBlocks.Common.Results;
using DijitalAtolye.Identity.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace DijitalAtolye.Identity.Application.Auth.Commands;

public sealed record VerifyTwoFactorSetupCommand(Guid UserId, string Code) : IRequest<Result<Unit>>;

public sealed class VerifyTwoFactorSetupCommandValidator : AbstractValidator<VerifyTwoFactorSetupCommand>
{
    public VerifyTwoFactorSetupCommandValidator()
    {
        RuleFor(x => x.Code).NotEmpty().Length(6, 8);
    }
}

public sealed class VerifyTwoFactorSetupCommandHandler : IRequestHandler<VerifyTwoFactorSetupCommand, Result<Unit>>
{
    private readonly UserManager<ApplicationUser> _userManager;

    public VerifyTwoFactorSetupCommandHandler(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<Result<Unit>> Handle(VerifyTwoFactorSetupCommand command, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(command.UserId.ToString());
        if (user is null)
        {
            return CommonErrors.NotFound("User", command.UserId);
        }

        var valid = await _userManager.VerifyTwoFactorTokenAsync(
            user,
            TokenOptions.DefaultAuthenticatorProvider,
            command.Code);
        if (!valid)
        {
            return Error.Validation("auth.2fa_invalid", "Doğrulama kodu geçersiz.");
        }

        await _userManager.SetTwoFactorEnabledAsync(user, true);
        return Unit.Value;
    }
}
