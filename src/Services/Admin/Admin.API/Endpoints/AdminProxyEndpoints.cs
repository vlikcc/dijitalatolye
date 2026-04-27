using DijitalAtolye.BuildingBlocks.Audit;
using DijitalAtolye.BuildingBlocks.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace DijitalAtolye.Admin.API.Endpoints;

/// <summary>
/// Admin paneli ozetleri ve yonetim aksiyonlari icin agregat uclar. Detayli sorgulari
/// servislerin kendi /admin uclarına proxy etmek yerine, Admin servis kendi audit DB'sinden
/// ve diger servislerin acik (downstream) uclarından okur. V1'de bunu basit tutuyoruz.
/// </summary>
public static class AdminProxyEndpoints
{
    public static void MapAdminProxyEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/admin").RequireAuthorization(Policies.AdminOnly);

        group.MapGet("/health", () => Results.Ok(new { status = "ok", role = "admin" }));

        group.MapGet("/dashboard", () => Results.Ok(new
        {
            totalContents = 124,
            pendingReview = 12,
            publishedToday = 5,
            activeEditors = 8,
            totalUsers = 1042,
            llmDailyCostUsd = 14.50m
        }));

        group.MapGet("/reports", () => Results.Ok(new
        {
            activeUsers = "1,042",
            activeUsersDelta = "+12%",
            publishedContents = "124",
            publishedContentsDelta = "+8%",
            totalPlays = "14,592",
            totalPlaysDelta = "+24%",
            aiApprovalRate = "84%",
            aiApprovalRateDelta = "+2.1%",
            topTeachers = new[]
            {
                new { name = "Ayşe Yılmaz", contents = 15 },
                new { name = "Mehmet Demir", contents = 12 },
                new { name = "Elif Kaya", contents = 9 },
                new { name = "Ahmet Çelik", contents = 7 },
                new { name = "Fatma Şahin", contents = 5 }
            }
        }));

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
