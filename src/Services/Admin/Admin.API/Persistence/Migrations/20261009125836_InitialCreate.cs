using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DijitalAtolye.Admin.API.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "admin");

            migrationBuilder.CreateTable(
                name: "AiModerationConfig",
                schema: "admin",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PrimaryProvider = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    FallbackProvider = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Model = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    MaxTokens = table.Column<int>(type: "integer", nullable: false),
                    PromptVersion = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    StaticAnalysisEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LlmEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    DailyCostLimitUsd = table.Column<decimal>(type: "numeric", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiModerationConfig", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiModerationConfig",
                schema: "admin");
        }
    }
}
