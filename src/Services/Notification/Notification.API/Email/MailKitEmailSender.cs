using MailKit.Net.Smtp;
using Microsoft.Extensions.Options;
using MimeKit;

namespace DijitalAtolye.Notification.API.Email;

public sealed class MailKitEmailSender : IEmailSender
{
    private readonly SmtpOptions _opts;
    private readonly ILogger<MailKitEmailSender> _logger;

    public MailKitEmailSender(IOptions<SmtpOptions> opts, ILogger<MailKitEmailSender> logger)
    {
        _opts = opts.Value;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default)
    {
        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress(_opts.FromName, _opts.FromAddress));
        msg.To.Add(MailboxAddress.Parse(toEmail));
        msg.Subject = subject;
        msg.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(_opts.Host, _opts.Port,
            _opts.UseSsl ? MailKit.Security.SecureSocketOptions.StartTls : MailKit.Security.SecureSocketOptions.Auto, ct);
        if (!string.IsNullOrEmpty(_opts.Username))
        {
            await client.AuthenticateAsync(_opts.Username, _opts.Password, ct);
        }
        await client.SendAsync(msg, ct);
        await client.DisconnectAsync(true, ct);
        _logger.LogInformation("E-posta gönderildi: {To} '{Subject}'", toEmail, subject);
    }
}
