using DijitalAtolye.BuildingBlocks.Common.Results;
using FluentValidation;
using MediatR;

namespace DijitalAtolye.Identity.Application.Auth.Commands;

public sealed record ForgotPasswordCommand(string Email) : IRequest<Result<Unit>>;

public sealed class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
    }
}
