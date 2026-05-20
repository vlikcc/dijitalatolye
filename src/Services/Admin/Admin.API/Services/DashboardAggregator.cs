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

        return new DashboardStats(
            content.TotalContents,
            content.PendingReview,
            content.PublishedToday,
            ActiveEditors: 0,
            users.TotalUsers,
            LlmDailyCostUsd: 0m);
    }

    public async Task<ReportsStats> GetReportsAsync(CancellationToken ct)
    {
        var content = await GetJsonAsync<ContentStatsDto>($"{_options.ContentBaseUrl}/contents/admin/stats", ct)
            ?? new ContentStatsDto();
        var analytics = await GetJsonAsync<AnalyticsStatsDto>($"{_options.AnalyticsBaseUrl}/analytics/admin/stats", ct)
            ?? new AnalyticsStatsDto();
        var users = await GetJsonAsync<UserStatsDto>($"{_options.UserBaseUrl}/users/admin/stats", ct)
            ?? new UserStatsDto();

        return new ReportsStats(
            ActiveUsers: users.TotalUsers.ToString("N0"),
            ActiveUsersDelta: "+0%",
            PublishedContents: content.PublishedTotal.ToString(),
            PublishedContentsDelta: "+0%",
            TotalPlays: analytics.TotalPlays.ToString("N0"),
            TotalPlaysDelta: "+0%",
            AiApprovalRate: "—",
            AiApprovalRateDelta: "—",
            TopTeachers: Array.Empty<TopTeacherDto>());
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
        int PublishedTotal = 0);
    private sealed record AnalyticsStatsDto(int TotalPlays = 0, int ActiveUsersLast30Days = 0);
    private sealed record UserStatsDto(int TotalUsers = 0, int Teachers = 0);
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
    IReadOnlyList<TopTeacherDto> TopTeachers);

public sealed record TopTeacherDto(string Name, int Contents);
