using DijitalAtolye.AIModeration.API.Persistence;
using DijitalAtolye.BuildingBlocks.Authentication;

namespace DijitalAtolye.AIModeration.API.Endpoints;

public static class ModerationEndpoints
{
    public static IEndpointRouteBuilder MapModerationEndpoints(this IEndpointRouteBuilder routes)
    {
        var grp = routes.MapGroup("/moderation").WithTags("Moderation").RequireAuthorization();

        grp.MapGet("/reports/{id:guid}", async (Guid id, IModerationReportStore store, CancellationToken ct) =>
        {
            var report = await store.GetByIdAsync(id, ct);
            return report is null ? Results.NotFound() : Results.Json(report);
        }).RequireAuthorization(Policies.EditorOrAbove);

        grp.MapGet("/contents/{contentId:guid}/versions/{versionId:guid}/report",
            async (Guid contentId, Guid versionId, IModerationReportStore store, CancellationToken ct) =>
        {
            var report = await store.GetByContentVersionAsync(contentId, versionId, ct);
            return report is null ? Results.NotFound() : Results.Json(report);
        }).RequireAuthorization(Policies.EditorOrAbove);

        // Admin: bugünün LLM moderasyon maliyeti/token/analiz sayısı (DashboardAggregator tüketir).
        grp.MapGet("/admin/stats", async (IModerationReportStore store, CancellationToken ct) =>
        {
            var s = await store.GetStatsSinceAsync(DateTime.UtcNow.Date, ct);
            return Results.Ok(new
            {
                analysesToday = s.Count,
                promptTokens = s.PromptTokens,
                completionTokens = s.CompletionTokens,
                estimatedCostUsd = s.EstimatedCostUsd,
            });
        }).RequireAuthorization(Policies.AdminOnly);

        return routes;
    }
}
