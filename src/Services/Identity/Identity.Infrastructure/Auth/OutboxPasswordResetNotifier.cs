using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Identity;
using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.Identity.Application.Auth.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace DijitalAtolye.Identity.Infrastructure.Auth;

/// <summary>
/// Şifre sıfırlama token'ını outbox üzerinden <see cref="PasswordResetRequestedV1"/> olarak yayınlar;
/// e-postayı Notification Service gönderir. Development'ta kolay test için URL ayrıca log'a yazılır.
/// </summary>
internal sealed class OutboxPasswordResetNotifier : IPasswordResetNotifier
{
    private readonly IOutboxWriter _outbox;
    private readonly ILogger<OutboxPasswordResetNotifier> _logger;
    private readonly IHostEnvironment _environment;
    private readonly string _resetUrlBase;

    public OutboxPasswordResetNotifier(
        IOutboxWriter outbox,
        IConfiguration configuration,
        IHostEnvironment environment,
        ILogger<OutboxPasswordResetNotifier> logger)
    {
        _outbox = outbox;
        _logger = logger;
        _environment = environment;
        _resetUrlBase = configuration["PasswordReset:UrlBase"]
            ?? "http://localhost:4200/reset-password";
    }

    public async Task NotifyAsync(Guid userId, string email, string token, CancellationToken ct)
    {
        await _outbox.WriteAsync(new PasswordResetRequestedV1
        {
            UserId = userId,
            Email = email,
            Token = token,
        }, ct: ct);

        if (_environment.IsDevelopment())
        {
            var url = $"{_resetUrlBase}?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";
            _logger.LogInformation("Password reset requested for {UserId}. Reset URL: {Url}", userId, url);
        }
        else
        {
            // KVKK: production log'larına e-posta adresi yazılmaz.
            _logger.LogInformation("Password reset requested for {UserId}.", userId);
        }
    }
}
