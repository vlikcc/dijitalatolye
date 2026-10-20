using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DijitalAtolye.Content.API.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddModerationRequeueCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ModerationRequeueCount",
                schema: "content",
                table: "Contents",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ModerationRequeueCount",
                schema: "content",
                table: "Contents");
        }
    }
}
