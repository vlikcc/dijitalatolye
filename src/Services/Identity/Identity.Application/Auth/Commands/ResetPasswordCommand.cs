using DijitalAtolye.BuildingBlocks.Common.Results;
using FluentValidation;
using MediatR;

namespace DijitalAtolye.Identity.Application.Auth.Commands;

public sealed record ResetPasswordCommand(
    string Email,
    string Token,
    string NewPassword) : IRequest<Result<Unit>>;

public sealed class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty()
            .MinimumLength(8).WithMessage("Şifre en az 8 karakter olmalı.")
            .Matches(@"[A-Z]").WithMessage("Şifre en az bir büyük harf içermeli.")
            .Matches(@"[a-z]").WithMessage("Şifre en az bir küçük harf içermeli.")
            .Matches(@"\d").WithMessage("Şifre en az bir rakam içermeli.");
    }
}
