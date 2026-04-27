using DijitalAtolye.Identity.Application.Auth.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DijitalAtolye.Identity.Infrastructure.Auth;

/// <summary>
/// Geçici implementasyon: token ve sıfırlama URL'sini structured log'a yazar.
/// Notification Service hazır olduğunda outbox/event tabanlı bir notifier ile değiştirilecek.
/// </summary>
internal sealed class LoggingPasswordResetNotifier : IPasswordResetNotifier
{
    private readonly ILogger<LoggingPasswordResetNotifier> _logger;
    private readonly string _resetUrlBase;

    public LoggingPasswordResetNotifier(
        IConfiguration configuration,
        ILogger<LoggingPasswordResetNotifier> logger)
    {
        _logger = logger;
        _resetUrlBase = configuration["PasswordReset:UrlBase"]
            ?? "http://localhost:5173/reset-password";
    }

    public Task NotifyAsync(Guid userId, string email, string token, CancellationToken ct)
    {
        var encodedToken = Uri.EscapeDataString(token);
        var encodedEmail = Uri.EscapeDataString(email);
        var url = $"{_resetUrlBase}?email={encodedEmail}&token={encodedToken}";

        _logger.LogInformation(
            "Password reset requested for {UserId} ({Email}). Reset URL: {Url}",
            userId, email, url);

        return Task.CompletedTask;
    }
}
