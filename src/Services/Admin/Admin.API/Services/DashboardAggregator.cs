using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace DijitalAtolye.Admin.API.Services;

public sealed class DownstreamServiceOptions
{
    public string ContentBaseUrl { get; set; } = "http://localhost:5005";
    public string AnalyticsBaseUrl { get; set; } = "http://localhost:5109";
    public string UserBaseUrl { get; set; } = "http://localhost:5002";
    public string ModerationBaseUrl { get; set; } = "http://localhost:5006";
}

public sealed class DashboardAggregator
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IHttpContextAccessor _httpContext;
    private readonly DownstreamServiceOptions _options;
    private readonly ILogger<DashboardAggregator> _logger;

    public DashboardAggregator(
        IHttpClientFactory httpFactory,
        IHttpContextAccessor httpContext,
        IOptions<DownstreamServiceOptions> options,
        ILogger<DashboardAggregator> logger)
    {
        _httpFactory = httpFactory;
        _httpContext = httpContext;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<DashboardStats> GetDashboardAsync(CancellationToken ct)
    {
        var content = await GetJsonAsync<ContentStatsDto>($"{_options.ContentBaseUrl}/contents/admin/stats", ct)
            ?? new ContentStatsDto();
        var analytics = await GetJsonAsync<AnalyticsStatsDto>($"{_options.AnalyticsBaseUrl}/analytics/admin/stats", ct)
            ?? new AnalyticsStatsDto();
        var users = await GetJsonAsync<UserStatsDto>($"{_options.UserBaseUrl}/users/admin/stats", ct)
            ?? new UserStatsDto();
        var moderation = await GetJsonAsync<ModerationStatsDto>($"{_options.ModerationBaseUrl}/moderation/admin/stats", ct)
            ?? new ModerationStatsDto();

        return new DashboardStats(
            content.TotalContents,
            content.PendingReview,
            content.PublishedToday,
            users.ActiveEditors,
            users.TotalUsers,
            LlmDailyCostUsd: moderation.EstimatedCostUsd);
    }

    public async Task<ReportsStats> GetReportsAsync(CancellationToken ct)
    {
        var content = await GetJsonAsync<ContentStatsDto>($"{_options.ContentBaseUrl}/contents/admin/stats", ct)
            ?? new ContentStatsDto();
        var analytics = await GetJsonAsync<AnalyticsStatsDto>($"{_options.AnalyticsBaseUrl}/analytics/admin/stats", ct)
            ?? new AnalyticsStatsDto();
        var users = await GetJsonAsync<UserStatsDto>($"{_options.UserBaseUrl}/users/admin/stats", ct)
            ?? new UserStatsDto();
        var moderation = await GetJsonAsync<ModerationStatsDto>($"{_options.ModerationBaseUrl}/moderation/admin/stats", ct)
            ?? new ModerationStatsDto();

        var aiRate = content.AiApprovalRatePercent > 0
            ? $"{content.AiApprovalRatePercent:0.#}%"
            : "—";

        // Top teacher GUID id'lerini gerçek görünen adla eşle (User servisi); başarısızsa kısa-id fallback.
        var topRaw = content.TopTeachers ?? [];
        var ids = topRaw.Where(t => t.AuthorId != Guid.Empty).Select(t => t.AuthorId).ToArray();
        var nameMap = new Dictionary<Guid, string>();
        if (ids.Length > 0)
        {
            var idsParam = string.Join(',', ids);
            var names = await GetJsonAsync<List<UserNameDto>>(
                $"{_options.UserBaseUrl}/users/names?ids={Uri.EscapeDataString(idsParam)}", ct);
            foreach (var n in names ?? []) nameMap[n.UserId] = n.DisplayName;
        }
        var topTeachers = topRaw
            .Select(t => new TopTeacherDto(
                nameMap.TryGetValue(t.AuthorId, out var dn) && !string.IsNullOrWhiteSpace(dn) ? dn : t.Name,
                t.Contents))
            .ToArray();

        return new ReportsStats(
            ActiveUsers: analytics.ActiveUsersLast30Days > 0
                ? analytics.ActiveUsersLast30Days.ToString("N0")
                : users.TotalUsers.ToString("N0"),
            ActiveUsersDelta: analytics.ActiveUsersLast30Days > 0 ? "son 30 gün" : "—",
            PublishedContents: content.PublishedTotal.ToString("N0"),
            PublishedContentsDelta: content.PublishedToday > 0 ? $"+{content.PublishedToday} bugün" : "—",
            TotalPlays: analytics.TotalPlays.ToString("N0"),
            TotalPlaysDelta: "—",
            AiApprovalRate: aiRate,
            AiApprovalRateDelta: content.AiAutoRejected > 0 ? $"{content.AiAutoRejected} otomatik red" : "—",
            AiCostToday: $"${moderation.EstimatedCostUsd:0.00##}",
            AiCostTodayDelta: moderation.AnalysesToday > 0 ? $"{moderation.AnalysesToday} analiz" : "—",
            TopTeachers: topTeachers);
    }

    private async Task<T?> GetJsonAsync<T>(string url, CancellationToken ct) where T : class
    {
        try
        {
            var client = _httpFactory.CreateClient("admin-downstream");
            var auth = _httpContext.HttpContext?.Request.Headers.Authorization.ToString();
            if (!string.IsNullOrEmpty(auth))
                client.DefaultRequestHeaders.Authorization = AuthenticationHeaderValue.Parse(auth);

            var resp = await client.GetAsync(url, ct);
            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogWarning("Downstream call failed {Url}: {Status}", url, resp.StatusCode);
                return null;
            }
            return await resp.Content.ReadFromJsonAsync<T>(cancellationToken: ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Downstream call error {Url}", url);
            return null;
        }
    }

    private sealed record ContentStatsDto(
        int TotalContents = 0,
        int PendingReview = 0,
        int PublishedToday = 0,
        int PublishedTotal = 0,
        int AiAutoRejected = 0,
        double AiApprovalRatePercent = 0,
        IReadOnlyList<ContentTopTeacherDto>? TopTeachers = null);
    private sealed record ContentTopTeacherDto(Guid AuthorId = default, string Name = "", int Contents = 0);
    private sealed record AnalyticsStatsDto(int TotalPlays = 0, int ActiveUsersLast30Days = 0);
    private sealed record UserStatsDto(int TotalUsers = 0, int Teachers = 0, int ActiveEditors = 0);
    private sealed record ModerationStatsDto(int AnalysesToday = 0, long PromptTokens = 0, long CompletionTokens = 0, decimal EstimatedCostUsd = 0m);
    private sealed record UserNameDto(Guid UserId = default, string DisplayName = "");
}

public sealed record DashboardStats(
    int TotalContents,
    int PendingReview,
    int PublishedToday,
    int ActiveEditors,
    int TotalUsers,
    decimal LlmDailyCostUsd);

public sealed record ReportsStats(
    string ActiveUsers,
    string ActiveUsersDelta,
    string PublishedContents,
    string PublishedContentsDelta,
    string TotalPlays,
    string TotalPlaysDelta,
    string AiApprovalRate,
    string AiApprovalRateDelta,
    string AiCostToday,
    string AiCostTodayDelta,
    IReadOnlyList<TopTeacherDto> TopTeachers);

public sealed record TopTeacherDto(string Name, int Contents);
