using DijitalAtolye.BuildingBlocks.Common.Results;
using FluentValidation;
using MediatR;

namespace DijitalAtolye.Identity.Application.Auth.Commands;

public sealed record RegisterUserCommand(
    string Email,
    string Password,
    string DisplayName,
    string Role) : IRequest<Result<RegisterUserResult>>;

public sealed record RegisterUserResult(Guid UserId, string Email);

public sealed class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    private static readonly string[] AllowedRoles =
        ["Student", "Teacher"];

    public RegisterUserCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty()
            .MinimumLength(8).WithMessage("Şifre en az 8 karakter olmalı.")
            .Matches(@"[A-Z]").WithMessage("Şifre en az bir büyük harf içermeli.")
            .Matches(@"[a-z]").WithMessage("Şifre en az bir küçük harf içermeli.")
            .Matches(@"\d").WithMessage("Şifre en az bir rakam içermeli.");
        RuleFor(x => x.DisplayName).NotEmpty().MinimumLength(2).MaximumLength(120);
        RuleFor(x => x.Role).Must(r => AllowedRoles.Contains(r))
            .WithMessage($"Rol şunlardan biri olmalı: {string.Join(", ", AllowedRoles)}");
    }
}
