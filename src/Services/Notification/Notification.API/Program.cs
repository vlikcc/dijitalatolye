using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.EventBus.Configuration;
using DijitalAtolye.BuildingBlocks.Common;
using DijitalAtolye.BuildingBlocks.WebHostExtensions;
using DijitalAtolye.Notification.API.Consumers;
using DijitalAtolye.Notification.API.Email;
using DijitalAtolye.Notification.API.Endpoints;
using DijitalAtolye.Notification.API.Persistence;
using DijitalAtolye.Notification.API.Realtime;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddDijitalAtolyeServiceDefaults("notification");

builder.Services.AddDbContext<NotificationDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")
        ?? throw new InvalidOperationException("Postgres connection string missing.")));

builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("Smtp"));
builder.Services.Configure<DijitalAtolye.Notification.API.Push.VapidOptions>(builder.Configuration.GetSection("WebPush"));
builder.Services.AddSingleton<IHtmlTemplateRenderer, FileHtmlTemplateRenderer>();
builder.Services.AddScoped<IEmailSender, MailKitEmailSender>();
builder.Services.AddScoped<DijitalAtolye.Notification.API.Push.IPushSender, DijitalAtolye.Notification.API.Push.WebPushSender>();

builder.Services.AddSignalR();
builder.Services.AddScoped<ICurrentUser, CurrentUserAccessor>();
builder.Services.AddDijitalAtolyeJwtAuth(builder.Configuration);

builder.Services.AddDijitalAtolyeEventBus(
    builder.Configuration,
    serviceName: "notification",
    configureBus: null,
    typeof(UserRegisteredConsumer).Assembly);

builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Postgres")!, tags: ["ready"]);

var app = builder.Build();
app.UseDijitalAtolyeServiceDefaults();
app.UseAuthentication();
app.UseAuthorization();
app.MapNotificationEndpoints();
app.MapHub<NotificationsHub>("/hubs/notifications");

if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Database:AutoMigrate"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

    // EnsureSchemaAsync "ya hep ya hiç"; yeni PushSubscriptions tablosu eklenince mevcut DB'de 42P07 verir.
    try
    {
        await db.EnsureSchemaAsync();
    }
    catch (Npgsql.PostgresException ex) when (ex.SqlState == "42P07")
    {
        // beklenen: mevcut tablolar var; eksik yeni tabloyu DDL ekleyecek.
    }

    await db.Database.ExecuteSqlRawAsync(
        """
        CREATE TABLE IF NOT EXISTS "notification"."PushSubscriptions" (
            "Id" uuid NOT NULL,
            "UserId" uuid NOT NULL,
            "Endpoint" character varying(1000) NOT NULL,
            "P256dh" character varying(300) NOT NULL,
            "Auth" character varying(300) NOT NULL,
            "CreatedAtUtc" timestamp with time zone NOT NULL DEFAULT now(),
            CONSTRAINT "PK_PushSubscriptions" PRIMARY KEY ("Id")
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_PushSubscriptions_Endpoint" ON "notification"."PushSubscriptions" ("Endpoint");
        CREATE INDEX IF NOT EXISTS "IX_PushSubscriptions_UserId" ON "notification"."PushSubscriptions" ("UserId");
        """);
}

app.Run();
