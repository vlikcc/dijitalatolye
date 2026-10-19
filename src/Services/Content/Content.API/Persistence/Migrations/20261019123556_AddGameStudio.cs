using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DijitalAtolye.Content.API.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGameStudio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GeneratedByModel",
                schema: "content",
                table: "Contents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Source",
                schema: "content",
                table: "Contents",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Upload");

            migrationBuilder.CreateTable(
                name: "StudioSessions",
                schema: "content",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Idea = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    Subjects = table.Column<List<string>>(type: "text[]", nullable: false),
                    GradeLevels = table.Column<List<int>>(type: "integer[]", nullable: false),
                    OutcomeCodes = table.Column<List<string>>(type: "text[]", nullable: false),
                    Model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    KeySource = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SelectedTurnId = table.Column<Guid>(type: "uuid", nullable: true),
                    ContentId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudioSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserAiCredentials",
                schema: "content",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    EncryptedApiKey = table.Column<string>(type: "text", nullable: false),
                    KeyLast4 = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserAiCredentials", x => x.UserId);
                });

            migrationBuilder.CreateTable(
                name: "StudioTurns",
                schema: "content",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Seq = table.Column<int>(type: "integer", nullable: false),
                    UserPrompt = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    KeySource = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Html = table.Column<string>(type: "text", nullable: true),
                    ChangeSummary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Error = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ProgressChars = table.Column<int>(type: "integer", nullable: false),
                    PromptTokens = table.Column<int>(type: "integer", nullable: false),
                    CompletionTokens = table.Column<int>(type: "integer", nullable: false),
                    PreviewKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudioTurns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudioTurns_StudioSessions_SessionId",
                        column: x => x.SessionId,
                        principalSchema: "content",
                        principalTable: "StudioSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StudioSessions_OwnerUserId",
                schema: "content",
                table: "StudioSessions",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StudioTurns_OwnerUserId_CreatedAtUtc",
                schema: "content",
                table: "StudioTurns",
                columns: new[] { "OwnerUserId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_StudioTurns_SessionId_Seq",
                schema: "content",
                table: "StudioTurns",
                columns: new[] { "SessionId", "Seq" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudioTurns_Status",
                schema: "content",
                table: "StudioTurns",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudioTurns",
                schema: "content");

            migrationBuilder.DropTable(
                name: "UserAiCredentials",
                schema: "content");

            migrationBuilder.DropTable(
                name: "StudioSessions",
                schema: "content");

            migrationBuilder.DropColumn(
                name: "GeneratedByModel",
                schema: "content",
                table: "Contents");

            migrationBuilder.DropColumn(
                name: "Source",
                schema: "content",
                table: "Contents");
        }
    }
}
