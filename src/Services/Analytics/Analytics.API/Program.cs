using DijitalAtolye.Analytics.API.Aggregation;
using DijitalAtolye.Analytics.API.Consumers;
using DijitalAtolye.Analytics.API.Endpoints;
using DijitalAtolye.Analytics.API.Persistence;
using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.EventBus.Configuration;
using DijitalAtolye.BuildingBlocks.Common;
using DijitalAtolye.BuildingBlocks.WebHostExtensions;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddDijitalAtolyeServiceDefaults("analytics");

builder.Services.AddDbContext<AnalyticsDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")
        ?? "Host=localhost;Port=5432;Database=analytics;Username=postgres;Password="));

builder.Services.AddScoped<ICurrentUser, CurrentUserAccessor>();
builder.Services.AddDijitalAtolyeJwtAuth(builder.Configuration);
builder.Services.AddAuthorization();

builder.Services.AddDijitalAtolyeEventBus(
    builder.Configuration,
    serviceName: "analytics",
    configureBus: null,
    typeof(ContentPublishedConsumer).Assembly);

builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Postgres")
        ?? "Host=localhost;Port=5432;Database=analytics;Username=postgres;Password=", name: "postgres");

// Ham olayları gün bazlı agregatlara toplayan worker.
builder.Services.AddHostedService<AnalyticsAggregator>();

var app = builder.Build();

app.UseDijitalAtolyeServiceDefaults();
app.UseAuthentication();
app.UseAuthorization();

app.MapAnalyticsEndpoints();

if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Database:AutoMigrate"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AnalyticsDbContext>();

    // EnsureSchemaAsync "ya hep ya hiç" davranır: model tablolarından biri eksikse TÜM tabloları yaratmayı dener.
    // Mevcut (ör. prod) DB'de events/content_daily_stats zaten var olduğundan, yeni tablolar eklenince bu çağrı
    // "relation already exists" (42P07) ile patlar. Bu durumu yakalayıp aşağıdaki idempotent DDL'e bırakıyoruz.
    // Fresh DB'de ise EnsureSchemaAsync tüm tabloları sorunsuz yaratır; idempotent DDL no-op olur.
    try
    {
        await db.EnsureSchemaAsync().ConfigureAwait(false);
    }
    catch (Npgsql.PostgresException ex) when (ex.SqlState == "42P07")
    {
        // beklenen: mevcut DB'de bazı tablolar zaten var; eksik yeni tablo/kolonları DDL ekleyecek.
    }

    // Yeni tablo/kolonları idempotent olarak garanti et (fresh + mevcut DB için tek yol).
    await db.Database.ExecuteSqlRawAsync(
        """
        CREATE SCHEMA IF NOT EXISTS analytics;
        ALTER TABLE analytics.events ADD COLUMN IF NOT EXISTS "Score" integer;
        ALTER TABLE analytics.events ADD COLUMN IF NOT EXISTS "OutcomeCode" character varying(32);
        CREATE INDEX IF NOT EXISTS "IX_events_OutcomeCode_OccurredAt" ON analytics.events ("OutcomeCode", "OccurredAt");
        ALTER TABLE analytics.content_daily_stats ADD COLUMN IF NOT EXISTS "ScoreSum" bigint NOT NULL DEFAULT 0;
        ALTER TABLE analytics.content_daily_stats ADD COLUMN IF NOT EXISTS "ScoreCount" integer NOT NULL DEFAULT 0;
        CREATE TABLE IF NOT EXISTS analytics.outcome_daily_stats (
            "ContentId" uuid NOT NULL,
            "OutcomeCode" character varying(32) NOT NULL,
            "Day" date NOT NULL,
            "Completes" integer NOT NULL,
            "Progresses" integer NOT NULL,
            "ScoreSum" bigint NOT NULL,
            "ScoreCount" integer NOT NULL,
            CONSTRAINT "PK_outcome_daily_stats" PRIMARY KEY ("ContentId", "OutcomeCode", "Day")
        );
        CREATE TABLE IF NOT EXISTS analytics.aggregation_state (
            "Id" integer NOT NULL,
            "LastRunUtc" timestamp with time zone NOT NULL,
            CONSTRAINT "PK_aggregation_state" PRIMARY KEY ("Id")
        );
        """).ConfigureAwait(false);
}

await app.RunAsync().ConfigureAwait(false);
