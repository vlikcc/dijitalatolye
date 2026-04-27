using DijitalAtolye.BuildingBlocks.Common.Errors;
using DijitalAtolye.BuildingBlocks.Common.Results;
using DijitalAtolye.Identity.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace DijitalAtolye.Identity.Application.Auth.Commands;

public sealed class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, Result<Unit>>
{
    private readonly UserManager<ApplicationUser> _userManager;

    public ResetPasswordCommandHandler(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<Result<Unit>> Handle(ResetPasswordCommand command, CancellationToken ct)
    {
        var user = await _userManager.FindByEmailAsync(command.Email);
        if (user is null)
        {
            return Error.Validation("auth.reset_invalid", "Sıfırlama bağlantısı geçersiz veya süresi dolmuş.");
        }

        var result = await _userManager.ResetPasswordAsync(user, command.Token, command.NewPassword);
        if (!result.Succeeded)
        {
            var first = result.Errors.FirstOrDefault();
            return Error.Validation(
                first?.Code ?? "auth.reset_failed",
                first?.Description ?? "Sıfırlama bağlantısı geçersiz veya süresi dolmuş.");
        }

        return Unit.Value;
    }
}
