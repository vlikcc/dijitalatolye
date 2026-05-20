using DijitalAtolye.Admin.API.Domain;
using DijitalAtolye.Admin.API.Persistence;
using DijitalAtolye.BuildingBlocks.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.Admin.API.Endpoints;

public static class AiConfigEndpoints
{
    public static IEndpointRouteBuilder MapAiConfigEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/admin/ai-config").RequireAuthorization(Policies.AdminOnly).WithTags("Admin");

        group.MapGet("/", async (AdminDbContext db, CancellationToken ct) =>
        {
            var config = await db.AiConfigs.AsNoTracking().FirstOrDefaultAsync(c => c.Id == 1, ct);
            return Results.Ok(config ?? new AiModerationConfig());
        });

        group.MapPut("/", async ([FromBody] UpdateAiConfigRequest body, AdminDbContext db, CancellationToken ct) =>
        {
            var config = await db.AiConfigs.FirstOrDefaultAsync(c => c.Id == 1, ct);
            if (config is null)
            {
                config = new AiModerationConfig { Id = 1 };
                db.AiConfigs.Add(config);
            }
            if (body.PrimaryProvider is not null) config.PrimaryProvider = body.PrimaryProvider;
            if (body.FallbackProvider is not null) config.FallbackProvider = body.FallbackProvider;
            if (body.Model is not null) config.Model = body.Model;
            if (body.MaxTokens is not null) config.MaxTokens = body.MaxTokens.Value;
            if (body.PromptVersion is not null) config.PromptVersion = body.PromptVersion;
            if (body.StaticAnalysisEnabled is not null) config.StaticAnalysisEnabled = body.StaticAnalysisEnabled.Value;
            if (body.LlmEnabled is not null) config.LlmEnabled = body.LlmEnabled.Value;
            if (body.DailyCostLimitUsd is not null) config.DailyCostLimitUsd = body.DailyCostLimitUsd.Value;
            config.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Ok(config);
        });

        return app;
    }
}

public sealed record UpdateAiConfigRequest(
    string? PrimaryProvider,
    string? FallbackProvider,
    string? Model,
    int? MaxTokens,
    string? PromptVersion,
    bool? StaticAnalysisEnabled,
    bool? LlmEnabled,
    decimal? DailyCostLimitUsd);
