using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DijitalAtolye.Content.API.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "content");

            migrationBuilder.CreateTable(
                name: "ContentComments",
                schema: "content",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ContentId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Body = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsHidden = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContentComments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContentFavorites",
                schema: "content",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ContentId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContentFavorites", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContentLikes",
                schema: "content",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ContentId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContentLikes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContentRatings",
                schema: "content",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ContentId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContentRatings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Contents",
                schema: "content",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Game"),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Slug = table.Column<string>(type: "character varying(220)", maxLength: 220, nullable: true),
                    Subjects = table.Column<List<string>>(type: "text[]", nullable: false),
                    GradeLevels = table.Column<List<int>>(type: "integer[]", nullable: false),
                    OutcomeCodes = table.Column<List<string>>(type: "text[]", nullable: false),
                    Tags = table.Column<List<string>>(type: "text[]", nullable: false),
                    State = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    AutoRejectReason = table.Column<string>(type: "text", nullable: true),
                    CurrentVersionId = table.Column<Guid>(type: "uuid", nullable: true),
                    TargetAge = table.Column<int>(type: "integer", nullable: true),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    Difficulty = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    CoverImageBucket = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    CoverImageKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PublishedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PublishedBucket = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    PublishedKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AiSuggestionJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OutboxMessages",
                schema: "content",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EventType = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    Payload = table.Column<string>(type: "text", nullable: false),
                    CorrelationId = table.Column<Guid>(type: "uuid", nullable: true),
                    OccurredOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Error = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    RetryCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboxMessages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContentVersions",
                schema: "content",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ContentId = table.Column<Guid>(type: "uuid", nullable: false),
                    VersionNumber = table.Column<int>(type: "integer", nullable: false),
                    StorageBucket = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    StorageKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ManifestEntry = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ManifestJson = table.Column<string>(type: "text", nullable: true),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    Sha256 = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChangeLog = table.Column<string>(type: "text", nullable: true),
                    GuardFileId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    GuardScanStatus = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    GuardScannedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContentVersions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContentVersions_Contents_ContentId",
                        column: x => x.ContentId,
                        principalSchema: "content",
                        principalTable: "Contents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContentComments_ContentId",
                schema: "content",
                table: "ContentComments",
                column: "ContentId");

            migrationBuilder.CreateIndex(
                name: "IX_ContentFavorites_ContentId_UserId",
                schema: "content",
                table: "ContentFavorites",
                columns: new[] { "ContentId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContentLikes_ContentId_UserId",
                schema: "content",
                table: "ContentLikes",
                columns: new[] { "ContentId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContentRatings_ContentId_UserId",
                schema: "content",
                table: "ContentRatings",
                columns: new[] { "ContentId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Contents_AuthorUserId",
                schema: "content",
                table: "Contents",
                column: "AuthorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Contents_Slug",
                schema: "content",
                table: "Contents",
                column: "Slug",
                unique: true,
                filter: "\"Slug\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Contents_State",
                schema: "content",
                table: "Contents",
                column: "State");

            migrationBuilder.CreateIndex(
                name: "IX_Contents_Type",
                schema: "content",
                table: "Contents",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_ContentVersions_ContentId_VersionNumber",
                schema: "content",
                table: "ContentVersions",
                columns: new[] { "ContentId", "VersionNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessages_ProcessedAt_OccurredOn",
                schema: "content",
                table: "OutboxMessages",
                columns: new[] { "ProcessedAt", "OccurredOn" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContentComments",
                schema: "content");

            migrationBuilder.DropTable(
                name: "ContentFavorites",
                schema: "content");

            migrationBuilder.DropTable(
                name: "ContentLikes",
                schema: "content");

            migrationBuilder.DropTable(
                name: "ContentRatings",
                schema: "content");

            migrationBuilder.DropTable(
                name: "ContentVersions",
                schema: "content");

            migrationBuilder.DropTable(
                name: "OutboxMessages",
                schema: "content");

            migrationBuilder.DropTable(
                name: "Contents",
                schema: "content");
        }
    }
}
