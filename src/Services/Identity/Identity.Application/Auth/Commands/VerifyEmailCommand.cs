using DijitalAtolye.BuildingBlocks.Common.Errors;
using DijitalAtolye.BuildingBlocks.Common.Results;
using DijitalAtolye.Identity.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace DijitalAtolye.Identity.Application.Auth.Commands;

public sealed record VerifyEmailCommand(string Email, string Token) : IRequest<Result<Unit>>;

public sealed class VerifyEmailCommandValidator : AbstractValidator<VerifyEmailCommand>
{
    public VerifyEmailCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Token).NotEmpty();
    }
}

public sealed class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand, Result<Unit>>
{
    private readonly UserManager<ApplicationUser> _userManager;

    public VerifyEmailCommandHandler(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<Result<Unit>> Handle(VerifyEmailCommand command, CancellationToken ct)
    {
        var user = await _userManager.FindByEmailAsync(command.Email);
        if (user is null)
        {
            return Error.Validation("auth.verify_invalid", "Doğrulama bağlantısı geçersiz veya süresi dolmuş.");
        }

        if (user.EmailConfirmed)
        {
            return Unit.Value;
        }

        var result = await _userManager.ConfirmEmailAsync(user, command.Token);
        if (!result.Succeeded)
        {
            var first = result.Errors.FirstOrDefault();
            return Error.Validation(
                first?.Code ?? "auth.verify_invalid",
                first?.Description ?? "Doğrulama bağlantısı geçersiz veya süresi dolmuş.");
        }

        return Unit.Value;
    }
}
