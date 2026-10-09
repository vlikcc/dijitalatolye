using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DijitalAtolye.Analytics.API.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "analytics");

            migrationBuilder.CreateTable(
                name: "aggregation_state",
                schema: "analytics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LastRunUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_aggregation_state", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "content_daily_stats",
                schema: "analytics",
                columns: table => new
                {
                    ContentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Day = table.Column<DateOnly>(type: "date", nullable: false),
                    Views = table.Column<int>(type: "integer", nullable: false),
                    Plays = table.Column<int>(type: "integer", nullable: false),
                    Completes = table.Column<int>(type: "integer", nullable: false),
                    Likes = table.Column<int>(type: "integer", nullable: false),
                    Favorites = table.Column<int>(type: "integer", nullable: false),
                    Shares = table.Column<int>(type: "integer", nullable: false),
                    TotalDurationSeconds = table.Column<long>(type: "bigint", nullable: false),
                    ScoreSum = table.Column<long>(type: "bigint", nullable: false),
                    ScoreCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_content_daily_stats", x => new { x.ContentId, x.Day });
                });

            migrationBuilder.CreateTable(
                name: "events",
                schema: "analytics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ContentId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    AnonymousSessionId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    DurationSeconds = table.Column<int>(type: "integer", nullable: true),
                    Score = table.Column<int>(type: "integer", nullable: true),
                    OutcomeCode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    Source = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    IpHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    OccurredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_events", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "outcome_daily_stats",
                schema: "analytics",
                columns: table => new
                {
                    ContentId = table.Column<Guid>(type: "uuid", nullable: false),
                    OutcomeCode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Day = table.Column<DateOnly>(type: "date", nullable: false),
                    Completes = table.Column<int>(type: "integer", nullable: false),
                    Progresses = table.Column<int>(type: "integer", nullable: false),
                    ScoreSum = table.Column<long>(type: "bigint", nullable: false),
                    ScoreCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_outcome_daily_stats", x => new { x.ContentId, x.OutcomeCode, x.Day });
                });

            migrationBuilder.CreateIndex(
                name: "IX_events_ContentId_OccurredAt",
                schema: "analytics",
                table: "events",
                columns: new[] { "ContentId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_events_OutcomeCode_OccurredAt",
                schema: "analytics",
                table: "events",
                columns: new[] { "OutcomeCode", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_events_Type_OccurredAt",
                schema: "analytics",
                table: "events",
                columns: new[] { "Type", "OccurredAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "aggregation_state",
                schema: "analytics");

            migrationBuilder.DropTable(
                name: "content_daily_stats",
                schema: "analytics");

            migrationBuilder.DropTable(
                name: "events",
                schema: "analytics");

            migrationBuilder.DropTable(
                name: "outcome_daily_stats",
                schema: "analytics");
        }
    }
}
