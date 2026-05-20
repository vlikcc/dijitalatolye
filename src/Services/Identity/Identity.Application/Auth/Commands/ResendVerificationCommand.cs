using DijitalAtolye.BuildingBlocks.Common.Results;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Identity;
using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.Identity.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace DijitalAtolye.Identity.Application.Auth.Commands;

public sealed record ResendVerificationCommand(string Email) : IRequest<Result<Unit>>;

public sealed class ResendVerificationCommandValidator : AbstractValidator<ResendVerificationCommand>
{
    public ResendVerificationCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
    }
}

public sealed class ResendVerificationCommandHandler : IRequestHandler<ResendVerificationCommand, Result<Unit>>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IOutboxWriter _outbox;
    private readonly ILogger<ResendVerificationCommandHandler> _logger;

    public ResendVerificationCommandHandler(
        UserManager<ApplicationUser> userManager,
        IOutboxWriter outbox,
        ILogger<ResendVerificationCommandHandler> logger)
    {
        _userManager = userManager;
        _outbox = outbox;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(ResendVerificationCommand command, CancellationToken ct)
    {
        var user = await _userManager.FindByEmailAsync(command.Email);
        if (user is null || user.EmailConfirmed)
        {
            _logger.LogInformation("ResendVerification: bilinmeyen veya zaten doğrulanmış e-posta isteği.");
            return Unit.Value;
        }

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        await _outbox.WriteAsync(new EmailVerificationRequestedV1
        {
            UserId = user.Id,
            Email = user.Email!,
            Token = token,
        }, ct: ct);

        return Unit.Value;
    }
}
