using DijitalAtolye.BuildingBlocks.Common.Results;
using DijitalAtolye.Identity.Application.Auth.Services;
using DijitalAtolye.Identity.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace DijitalAtolye.Identity.Application.Auth.Commands;

public sealed class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, Result<Unit>>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IPasswordResetNotifier _notifier;
    private readonly ILogger<ForgotPasswordCommandHandler> _logger;

    public ForgotPasswordCommandHandler(
        UserManager<ApplicationUser> userManager,
        IPasswordResetNotifier notifier,
        ILogger<ForgotPasswordCommandHandler> logger)
    {
        _userManager = userManager;
        _notifier = notifier;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(ForgotPasswordCommand command, CancellationToken ct)
    {
        // Bilgi sızdırmamak için: kullanıcı yoksa veya doğrulanmamışsa bile başarılı dönüyoruz.
        var user = await _userManager.FindByEmailAsync(command.Email);
        if (user is null)
        {
            _logger.LogInformation("ForgotPassword: bilinmeyen email isteği geldi.");
            return Unit.Value;
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        await _notifier.NotifyAsync(user.Id, user.Email!, token, ct);

        return Unit.Value;
    }
}
