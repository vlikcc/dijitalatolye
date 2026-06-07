using DijitalAtolye.Admin.API.Services;
using DijitalAtolye.BuildingBlocks.Audit;
using DijitalAtolye.BuildingBlocks.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace DijitalAtolye.Admin.API.Endpoints;

public static class AdminProxyEndpoints
{
    public static void MapAdminProxyEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/admin").RequireAuthorization(Policies.AdminOnly);

        group.MapGet("/health", () => Results.Ok(new { status = "ok", role = "admin" }));

        group.MapGet("/dashboard", async (DashboardAggregator aggregator, CancellationToken ct) =>
        {
            var stats = await aggregator.GetDashboardAsync(ct);
            return Results.Ok(new
            {
                totalContents = stats.TotalContents,
                pendingReview = stats.PendingReview,
                publishedToday = stats.PublishedToday,
                activeEditors = stats.ActiveEditors,
                totalUsers = stats.TotalUsers,
                llmDailyCostUsd = stats.LlmDailyCostUsd,
            });
        });

        group.MapGet("/reports", async (DashboardAggregator aggregator, CancellationToken ct) =>
        {
            var stats = await aggregator.GetReportsAsync(ct);
            return Results.Ok(new
            {
                activeUsers = stats.ActiveUsers,
                activeUsersDelta = stats.ActiveUsersDelta,
                publishedContents = stats.PublishedContents,
                publishedContentsDelta = stats.PublishedContentsDelta,
                totalPlays = stats.TotalPlays,
                totalPlaysDelta = stats.TotalPlaysDelta,
                aiApprovalRate = stats.AiApprovalRate,
                aiApprovalRateDelta = stats.AiApprovalRateDelta,
                aiCostToday = stats.AiCostToday,
                aiCostTodayDelta = stats.AiCostTodayDelta,
                topTeachers = stats.TopTeachers,
            });
        });

        group.MapPost("/log", async (IAuditLogger audit, AdminActionLogDto dto) =>
        {
            await audit.LogAsync(
                action: AuditActions.AdminAction,
                entityType: dto.EntityType,
                entityId: dto.EntityId,
                payload: new { dto.Description, dto.Metadata },
                severity: dto.Severity ?? "Info").ConfigureAwait(false);
            return Results.NoContent();
        });
    }
}

public sealed record AdminActionLogDto(
    string Description,
    string? EntityType,
    string? EntityId,
    string? Severity,
    Dictionary<string, object?>? Metadata);
