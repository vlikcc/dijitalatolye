using System.Net.Http.Json;

namespace DijitalAtolye.Content.API.AiExtraction;

/// <summary>
/// Catalog.API üzerinden MEB kazanım listesini çeker (subject/grade filtreli).
/// LLM prompt'una enjekte edilmek üzere flat liste döner.
/// </summary>
public interface ICatalogOutcomeProvider
{
    Task<IReadOnlyList<CatalogOutcomeDto>> GetAsync(string? subject, int? grade, int limit, CancellationToken ct);
}

public sealed class CatalogOutcomeProvider : ICatalogOutcomeProvider
{
    private readonly HttpClient _http;
    private readonly ILogger<CatalogOutcomeProvider> _logger;

    public CatalogOutcomeProvider(HttpClient http, ILogger<CatalogOutcomeProvider> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<IReadOnlyList<CatalogOutcomeDto>> GetAsync(string? subject, int? grade, int limit, CancellationToken ct)
    {
        var qs = new List<string> { $"limit={limit}" };
        if (!string.IsNullOrWhiteSpace(subject)) qs.Add($"subject={Uri.EscapeDataString(subject)}");
        if (grade is not null) qs.Add($"grade={grade.Value}");
        var url = "/catalog/outcomes?" + string.Join('&', qs);

        try
        {
            var items = await _http.GetFromJsonAsync<List<CatalogOutcomeDto>>(url, ct);
            return items ?? new List<CatalogOutcomeDto>();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Catalog outcomes alınamadı (url={Url}); boş liste ile devam.", url);
            return Array.Empty<CatalogOutcomeDto>();
        }
    }
}
