using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Content;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Identity;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Review;
using DijitalAtolye.Notification.API.Domain;
using DijitalAtolye.Notification.API.Email;
using DijitalAtolye.Notification.API.Persistence;
using DijitalAtolye.Notification.API.Realtime;
using MassTransit;
using Microsoft.AspNetCore.SignalR;

namespace DijitalAtolye.Notification.API.Consumers;

public abstract class BaseNotificationConsumer
{
    protected readonly NotificationDbContext Db;
    protected readonly IEmailSender Email;
    protected readonly IHtmlTemplateRenderer Templates;
    protected readonly IHubContext<NotificationsHub> Hub;
    protected readonly ILogger Logger;

    protected BaseNotificationConsumer(
        NotificationDbContext db,
        IEmailSender email,
        IHtmlTemplateRenderer templates,
        IHubContext<NotificationsHub> hub,
        ILogger logger)
    {
        Db = db;
        Email = email;
        Templates = templates;
        Hub = hub;
        Logger = logger;
    }

    protected async Task EmitAsync(Guid userId, string type, string title, string body, string? link, CancellationToken ct)
    {
        var n = new InAppNotification
        {
            UserId = userId, Type = type, Title = title, Body = body, Link = link,
        };
        Db.Notifications.Add(n);
        await Db.SaveChangesAsync(ct);
        await Hub.Clients.Group($"user-{userId}").SendAsync("notification", n, ct);
    }

    protected async Task SendEmailSafeAsync(string toEmail, string subject, string template, string html, CancellationToken ct)
    {
        var log = new EmailLog { ToEmail = toEmail, Subject = subject, Template = template };
        try
        {
            await Email.SendAsync(toEmail, subject, html, ct);
            log.Success = true;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Email send failed for {To}", toEmail);
            log.Success = false;
            log.Error = ex.Message;
        }
        Db.EmailLogs.Add(log);
        await Db.SaveChangesAsync(ct);
    }
}

public sealed class UserRegisteredConsumer : BaseNotificationConsumer, IConsumer<UserRegisteredV1>
{
    private readonly IConfiguration _configuration;

    public UserRegisteredConsumer(
        NotificationDbContext db,
        IEmailSender email,
        IHtmlTemplateRenderer templates,
        IHubContext<NotificationsHub> hub,
        ILogger<UserRegisteredConsumer> logger,
        IConfiguration configuration)
        : base(db, email, templates, hub, logger)
    {
        _configuration = configuration;
    }

    public async Task Consume(ConsumeContext<UserRegisteredV1> context)
    {
        var msg = context.Message;
        await EmitAsync(msg.UserId, "UserRegistered", "Hoş geldiniz!",
            $"DijitalAtölye'ye kaydınız tamamlandı, {msg.DisplayName}.", "/", context.CancellationToken);
        var html = await Templates.RenderAsync("UserRegistered", new Dictionary<string, string>
        {
            ["DisplayName"] = msg.DisplayName,
            ["AppUrl"] = _configuration["App:Url"] ?? "http://localhost:5173",
        }, context.CancellationToken);
        await SendEmailSafeAsync(msg.Email, "DijitalAtölye'ye Hoş Geldiniz", "user-registered", html, context.CancellationToken);
    }
}

public sealed class EmailVerificationRequestedConsumer : BaseNotificationConsumer, IConsumer<EmailVerificationRequestedV1>
{
    private readonly IConfiguration _configuration;

    public EmailVerificationRequestedConsumer(
        NotificationDbContext db,
        IEmailSender email,
        IHtmlTemplateRenderer templates,
        IHubContext<NotificationsHub> hub,
        ILogger<EmailVerificationRequestedConsumer> logger,
        IConfiguration configuration)
        : base(db, email, templates, hub, logger)
    {
        _configuration = configuration;
    }

    public async Task Consume(ConsumeContext<EmailVerificationRequestedV1> context)
    {
        var msg = context.Message;
        var urlBase = _configuration["EmailVerification:UrlBase"]
            ?? "http://localhost:5173/verify-email";
        var encodedToken = Uri.EscapeDataString(msg.Token);
        var encodedEmail = Uri.EscapeDataString(msg.Email);
        var verifyUrl = $"{urlBase}?email={encodedEmail}&token={encodedToken}";

        var html = await Templates.RenderAsync("EmailVerification", new Dictionary<string, string>
        {
            ["VerifyUrl"] = verifyUrl,
        }, context.CancellationToken);

        await SendEmailSafeAsync(
            msg.Email,
            "E-posta adresinizi doğrulayın",
            "email-verification",
            html,
            context.CancellationToken);
    }
}

public sealed class ContentSubmittedConsumer : BaseNotificationConsumer, IConsumer<ContentSubmittedV1>
{
    public ContentSubmittedConsumer(NotificationDbContext db, IEmailSender email, IHtmlTemplateRenderer templates, IHubContext<NotificationsHub> hub, ILogger<ContentSubmittedConsumer> logger)
        : base(db, email, templates, hub, logger) { }

    public async Task Consume(ConsumeContext<ContentSubmittedV1> context)
    {
        var msg = context.Message;
        await EmitAsync(msg.AuthorUserId, "ContentSubmitted", "İçerik incelemeye gönderildi",
            $"\"{msg.Title}\" başlıklı içeriğiniz inceleme kuyruğuna alındı.",
            $"/teacher/contents/{msg.ContentId}", context.CancellationToken);
    }
}

public sealed class EditorDecisionConsumer : BaseNotificationConsumer, IConsumer<EditorDecisionMadeV1>
{
    public EditorDecisionConsumer(NotificationDbContext db, IEmailSender email, IHtmlTemplateRenderer templates, IHubContext<NotificationsHub> hub, ILogger<EditorDecisionConsumer> logger)
        : base(db, email, templates, hub, logger) { }

    public async Task Consume(ConsumeContext<EditorDecisionMadeV1> context)
    {
        var msg = context.Message;
        var (title, body) = msg.Decision switch
        {
            EditorDecision.Approved => ("İçeriğiniz onaylandı", "Editör içeriğinizi onayladı, yayına alındı."),
            EditorDecision.Rejected => ("İçeriğiniz reddedildi", $"Editör içeriğinizi reddetti. Yorum: {msg.Comment ?? "-"}"),
            EditorDecision.RevisionRequested => ("Revizyon istendi", $"Editör revizyon istedi. Yorum: {msg.Comment ?? "-"}"),
            _ => ("Karar verildi", "Editör inceleme tamamlandı."),
        };
        // İçerik sahibi UserId'sini event'te taşımıyoruz; pratikte Content service ile join gerek.
        // V1: ContentId'yi link olarak bildirim akışında yayınla, kullanıcı kendi panelinden görsün.
        // (UserId resolve etmek için ileride Content snapshot servisi eklenebilir.)
        Logger.LogInformation("EditorDecisionMade: content={Content} decision={Decision}", msg.ContentId, msg.Decision);
        _ = title; _ = body;
        await Task.CompletedTask;
    }
}

public sealed class ContentPublishedConsumer : BaseNotificationConsumer, IConsumer<ContentPublishedV1>
{
    public ContentPublishedConsumer(NotificationDbContext db, IEmailSender email, IHtmlTemplateRenderer templates, IHubContext<NotificationsHub> hub, ILogger<ContentPublishedConsumer> logger)
        : base(db, email, templates, hub, logger) { }

    public async Task Consume(ConsumeContext<ContentPublishedV1> context)
    {
        var msg = context.Message;
        await EmitAsync(msg.AuthorUserId, "ContentPublished", "İçeriğiniz yayında!",
            $"\"{msg.Title}\" içeriğiniz yayınlandı: {msg.PlayUrl}", msg.PlayUrl, context.CancellationToken);
    }
}
