using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.EventBus.Configuration;
using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.BuildingBlocks.Common;
using DijitalAtolye.BuildingBlocks.WebHostExtensions;
using DijitalAtolye.User.API.Consumers;
using DijitalAtolye.User.API.Endpoints;
using DijitalAtolye.User.API.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddDijitalAtolyeServiceDefaults("user");

builder.Services.AddDbContext<UserDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")
        ?? throw new InvalidOperationException("Postgres connection string missing.")));

builder.Services.AddScoped<ICurrentUser, CurrentUserAccessor>();
builder.Services.AddScoped<IOutboxWriter, EfCoreOutboxWriter<UserDbContext>>();
builder.Services.AddHostedService<OutboxDispatcher<UserDbContext>>();
builder.Services.AddHostedService<DijitalAtolye.User.API.Reminders.AssignmentReminderWorker>();

builder.Services.AddDijitalAtolyeJwtAuth(builder.Configuration);

builder.Services.AddDijitalAtolyeEventBus(
    builder.Configuration,
    serviceName: "user",
    consumerAssemblies: typeof(UserRegisteredConsumer).Assembly);

builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Postgres")!, tags: ["ready"]);

var app = builder.Build();

app.UseDijitalAtolyeServiceDefaults();
app.UseAuthentication();
app.UseAuthorization();
app.MapUserEndpoints();
app.MapKvkkEndpoints();
app.MapCollectionEndpoints();
app.MapNotificationPreferenceEndpoints();
app.MapUserStatsEndpoints();
app.MapAssignmentEndpoints();
app.MapClassEndpoints();

if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Database:AutoMigrate"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<UserDbContext>();

    // EnsureSchemaAsync "ya hep ya hiç" davranır: yeni Assignment* tabloları eklenince mevcut DB'de var olan
    // tablolar yüzünden 42P07 ile patlar. Bu durumu yakalayıp aşağıdaki idempotent DDL'e bırakıyoruz.
    try
    {
        await db.EnsureSchemaAsync();
    }
    catch (Npgsql.PostgresException ex) when (ex.SqlState == "42P07")
    {
        // beklenen: mevcut DB'de bazı tablolar zaten var; eksik yeni tabloları DDL ekleyecek.
    }

    await db.Database.ExecuteSqlRawAsync(
        """
        CREATE SCHEMA IF NOT EXISTS "user";
        CREATE TABLE IF NOT EXISTS "user"."Assignments" (
            "Id" uuid NOT NULL,
            "TeacherUserId" uuid NOT NULL,
            "ContentId" uuid NOT NULL,
            "ContentTitle" character varying(300) NOT NULL DEFAULT '',
            "ContentSlug" character varying(300),
            "Title" character varying(300) NOT NULL DEFAULT '',
            "Instructions" character varying(2000),
            "DueAtUtc" timestamp with time zone,
            "JoinCode" character varying(12) NOT NULL,
            "Status" character varying(20) NOT NULL DEFAULT 'Active',
            "CreatedAtUtc" timestamp with time zone NOT NULL DEFAULT now(),
            "UpdatedAtUtc" timestamp with time zone NOT NULL DEFAULT now(),
            CONSTRAINT "PK_Assignments" PRIMARY KEY ("Id")
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Assignments_JoinCode" ON "user"."Assignments" ("JoinCode");
        CREATE INDEX IF NOT EXISTS "IX_Assignments_TeacherUserId" ON "user"."Assignments" ("TeacherUserId");
        CREATE TABLE IF NOT EXISTS "user"."AssignmentMembers" (
            "Id" uuid NOT NULL,
            "AssignmentId" uuid NOT NULL,
            "StudentUserId" uuid NOT NULL,
            "StudentEmail" character varying(256) NOT NULL DEFAULT '',
            "JoinedAtUtc" timestamp with time zone NOT NULL DEFAULT now(),
            "CompletedAtUtc" timestamp with time zone,
            "BestScore" integer,
            CONSTRAINT "PK_AssignmentMembers" PRIMARY KEY ("Id"),
            CONSTRAINT "FK_AssignmentMembers_Assignments" FOREIGN KEY ("AssignmentId")
                REFERENCES "user"."Assignments" ("Id") ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_AssignmentMembers_Assignment_Student"
            ON "user"."AssignmentMembers" ("AssignmentId", "StudentUserId");
        CREATE INDEX IF NOT EXISTS "IX_AssignmentMembers_StudentUserId"
            ON "user"."AssignmentMembers" ("StudentUserId");
        ALTER TABLE "user"."Assignments" ADD COLUMN IF NOT EXISTS "ClassId" uuid;
        CREATE TABLE IF NOT EXISTS "user"."Classes" (
            "Id" uuid NOT NULL,
            "TeacherUserId" uuid NOT NULL,
            "Name" character varying(160) NOT NULL,
            "CreatedAtUtc" timestamp with time zone NOT NULL DEFAULT now(),
            "UpdatedAtUtc" timestamp with time zone NOT NULL DEFAULT now(),
            CONSTRAINT "PK_Classes" PRIMARY KEY ("Id")
        );
        CREATE INDEX IF NOT EXISTS "IX_Classes_TeacherUserId" ON "user"."Classes" ("TeacherUserId");
        CREATE TABLE IF NOT EXISTS "user"."ClassMembers" (
            "Id" uuid NOT NULL,
            "ClassId" uuid NOT NULL,
            "StudentUserId" uuid NOT NULL,
            "StudentEmail" character varying(256) NOT NULL DEFAULT '',
            "AddedAtUtc" timestamp with time zone NOT NULL DEFAULT now(),
            CONSTRAINT "PK_ClassMembers" PRIMARY KEY ("Id"),
            CONSTRAINT "FK_ClassMembers_Classes" FOREIGN KEY ("ClassId")
                REFERENCES "user"."Classes" ("Id") ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_ClassMembers_Class_Student"
            ON "user"."ClassMembers" ("ClassId", "StudentUserId");
        ALTER TABLE "user"."AssignmentMembers" ADD COLUMN IF NOT EXISTS "ReminderSentAtUtc" timestamp with time zone;
        """);
}

app.Run();
