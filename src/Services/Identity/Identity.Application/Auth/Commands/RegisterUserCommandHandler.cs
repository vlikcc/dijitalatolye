using DijitalAtolye.BuildingBlocks.Common.Errors;
using DijitalAtolye.BuildingBlocks.Common.Results;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Identity;
using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.Identity.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace DijitalAtolye.Identity.Application.Auth.Commands;

public sealed class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, Result<RegisterUserResult>>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IOutboxWriter _outbox;
    private readonly ILogger<RegisterUserCommandHandler> _logger;

    public RegisterUserCommandHandler(
        UserManager<ApplicationUser> userManager,
        IOutboxWriter outbox,
        ILogger<RegisterUserCommandHandler> logger)
    {
        _userManager = userManager;
        _outbox = outbox;
        _logger = logger;
    }

    public async Task<Result<RegisterUserResult>> Handle(RegisterUserCommand command, CancellationToken ct)
    {
        var existing = await _userManager.FindByEmailAsync(command.Email);
        if (existing is not null)
        {
            return CommonErrors.Conflict("auth.email_in_use", "Bu e-posta zaten kayıtlı.");
        }

        var user = new ApplicationUser
        {
            UserName = command.Email,
            Email = command.Email,
            DisplayName = command.DisplayName,
            EmailConfirmed = false,
        };

        var result = await _userManager.CreateAsync(user, command.Password);
        if (!result.Succeeded)
        {
            var first = result.Errors.FirstOrDefault();
            _logger.LogWarning("Identity create failed: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
            return Error.Validation(first?.Code ?? "auth.create_failed", first?.Description ?? "Kullanıcı oluşturulamadı.");
        }

        await _userManager.AddToRoleAsync(user, command.Role);

        await _outbox.WriteAsync(new UserRegisteredV1
        {
            UserId = user.Id,
            Email = user.Email!,
            DisplayName = user.DisplayName,
            PrimaryRole = command.Role,
        }, ct: ct);

        return new RegisterUserResult(user.Id, user.Email!);
    }
}
