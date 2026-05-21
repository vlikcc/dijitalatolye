using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace DijitalAtolye.Content.API.AiExtraction;

public sealed class DeepSeekExtractorOptions
{
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "deepseek-chat";
    public string Endpoint { get; set; } = "https://api.deepseek.com/v1";
    public decimal Temperature { get; set; } = 0.2m;
    public int OutcomeListMax { get; set; } = 150;
}

/// <summary>
/// İki aşamalı DeepSeek (OpenAI uyumlu) JSON-mode çağrısı.
/// Aşama 1: metinden subject/grade dahil draft metadata.
/// Aşama 2: subject+grade filtreli Catalog kazanımları arasından uygunları seçer.
/// </summary>
public sealed class DeepSeekMetadataExtractor : IContentMetadataExtractor
{
    private const string DraftSystemPrompt = """
Sen MEB müfredatına hâkim, Türkçe eğitim içeriklerinin metadata'sını çıkaran bir uzmansın.
Sana verilen bir öğretici/etkileşimli içeriğin metin örneğini incele ve aşağıdaki JSON şemasına
TAM UYAN tek bir JSON nesnesi döndür. Açıklama, markdown veya başka metin EKLEME.

Şema:
{
  "title": string | null,                // Kısa, açıklayıcı içerik başlığı (en fazla 120 karakter)
  "description": string | null,          // 1-3 cümlelik özet (en fazla 400 karakter)
  "subject": string | null,              // "Matematik", "Türkçe", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce"
  "gradeLevel": integer | null,          // 1-12 arası sınıf seviyesi
  "durationMinutes": integer | null,     // Tahmini etkinlik süresi (1-120)
  "difficulty": "Easy" | "Medium" | "Hard" | null,
  "tags": string[],                      // 3-7 adet kısa Türkçe etiket (küçük harf)
  "confidence": number                   // 0.0-1.0 arası güven skoru
}

Kurallar:
- subject alanını seçerken kullanıcı mesajındaki "Geçerli dersler" listesinden EN İYİ eşleşeni kullan.
- Tüm metinler Türkçe ve düzgün dilbilgisiyle yazılmalı.
- Hiçbir alan için "bilinmiyor" yazma; emin değilsen null bırak.
""";

    private const string OutcomeSystemPrompt = """
Sen MEB müfredatına hâkim bir uzmansın. Sana bir Türkçe eğitim içeriğinin metin örneği ve o
ders/sınıfa ait MEB kazanım kodlarının listesi verilecek. Görevin metne EN UYGUN 0-5 adet
kazanım kodunu **YALNIZCA verilen listeden** seçmek. Uygun kazanım yoksa boş dizi döndür.

Çıktıyı sadece şu JSON şemasına uyan tek bir nesne olarak ver:
{
  "outcomeCodes": string[]   // 0-5 adet, sadece verilen listedeki kodlar
}

Kurallar:
- Kazanım kodu UYDURMA. Sadece sana verilen listeden seç.
- Birden fazla uygun varsa metne en çok uyanları seç; emin değilsen daha az kod döndür.
- Açıklama veya başka alan ekleme.
""";

    private readonly HttpClient _http;
    private readonly DeepSeekExtractorOptions _options;
    private readonly ICatalogOutcomeProvider _catalog;
    private readonly ILogger<DeepSeekMetadataExtractor> _logger;

    public DeepSeekMetadataExtractor(
        HttpClient http,
        IOptions<DeepSeekExtractorOptions> options,
        ICatalogOutcomeProvider catalog,
        ILogger<DeepSeekMetadataExtractor> logger)
    {
        _http = http;
        _options = options.Value;
        _catalog = catalog;
        _logger = logger;
        _http.BaseAddress = new Uri(_options.Endpoint.TrimEnd('/') + "/");
        if (!string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
        }
    }

    public async Task<AiExtractedMetadataDto> ExtractAsync(string sampledText, CancellationToken ct)
    {
        // Aşama 1: draft metadata (subject/grade dahil; kazanım hariç)
        var draftJson = await CallLlmAsync(DraftSystemPrompt, BuildDraftUserPrompt(sampledText), ct);
        DraftFields draft;
        try { draft = ParseDraft(draftJson); }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "DeepSeek draft yanıtı parse edilemedi: {Json}", draftJson);
            throw new InvalidOperationException("DeepSeek draft yanıtı geçersiz JSON.", ex);
        }

        // Aşama 2: subject+grade filtreli Catalog kazanım listesini al ve ikinci LLM çağrısıyla seç
        IReadOnlyList<CatalogOutcomeDto> catalogOutcomes = Array.Empty<CatalogOutcomeDto>();
        string? outcomesJson = null;
        IReadOnlyList<string> pickedOutcomes = Array.Empty<string>();

        if (!string.IsNullOrWhiteSpace(draft.Subject) || draft.GradeLevel is not null)
        {
            catalogOutcomes = await _catalog.GetAsync(draft.Subject, draft.GradeLevel, _options.OutcomeListMax, ct);
            if (catalogOutcomes.Count > 0)
            {
                outcomesJson = await CallLlmAsync(
                    OutcomeSystemPrompt,
                    BuildOutcomeUserPrompt(sampledText, catalogOutcomes, draft),
                    ct);
                try { pickedOutcomes = ParseOutcomes(outcomesJson, catalogOutcomes); }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "DeepSeek outcome yanıtı parse edilemedi; boş liste ile devam: {Json}", outcomesJson);
                    pickedOutcomes = Array.Empty<string>();
                }
            }
        }

        return new AiExtractedMetadataDto(
            Title: draft.Title,
            Description: draft.Description,
            Subject: draft.Subject,
            GradeLevel: draft.GradeLevel,
            DurationMinutes: draft.DurationMinutes,
            Difficulty: draft.Difficulty,
            OutcomeCodes: pickedOutcomes,
            Tags: draft.Tags,
            Confidence: draft.Confidence,
            CandidateOutcomeCount: catalogOutcomes.Count,
            RawDraftResponse: draftJson,
            RawOutcomesResponse: outcomesJson);
    }

    private async Task<string> CallLlmAsync(string systemPrompt, string userPrompt, CancellationToken ct)
    {
        var request = new ChatRequest
        {
            Model = _options.Model,
            Temperature = _options.Temperature,
            ResponseFormat = new ResponseFormat("json_object"),
            Messages =
            [
                new ChatMessage("system", systemPrompt),
                new ChatMessage("user", userPrompt),
            ],
        };

        using var response = await _http.PostAsJsonAsync("chat/completions", request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("DeepSeek API error {Status}: {Body}", response.StatusCode, body);
            throw new InvalidOperationException($"DeepSeek API error {response.StatusCode}");
        }

        try
        {
            using var doc = JsonDocument.Parse(body);
            return doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "{}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DeepSeek dış yanıt parse hatası: {Body}", body);
            throw new InvalidOperationException("DeepSeek cevabı parse edilemedi.", ex);
        }
    }

    private static string BuildDraftUserPrompt(string sampledText)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Geçerli dersler: Matematik, Türkçe, Fen Bilimleri, Sosyal Bilgiler, İngilizce");
        sb.AppendLine();
        sb.AppendLine("İçerik metni örneği:");
        sb.AppendLine("---");
        sb.AppendLine(sampledText);
        sb.AppendLine("---");
        sb.AppendLine();
        sb.AppendLine("Şimdi şemaya uyan JSON'u üret.");
        return sb.ToString();
    }

    private string BuildOutcomeUserPrompt(string sampledText, IReadOnlyList<CatalogOutcomeDto> outcomes, DraftFields draft)
    {
        var sb = new StringBuilder();
        sb.Append("Ders: ").AppendLine(draft.Subject ?? "(bilinmiyor)");
        sb.Append("Sınıf: ").AppendLine(draft.GradeLevel?.ToString() ?? "(bilinmiyor)");
        sb.AppendLine();
        sb.AppendLine($"Geçerli kazanım listesi ({outcomes.Count} adet — yalnızca buradan seç):");
        foreach (var o in outcomes.Take(_options.OutcomeListMax))
        {
            sb.Append("- ").Append(o.Code).Append(": ").AppendLine(o.Description);
        }
        sb.AppendLine();
        sb.AppendLine("İçerik metni örneği:");
        sb.AppendLine("---");
        sb.AppendLine(sampledText);
        sb.AppendLine("---");
        sb.AppendLine();
        sb.AppendLine("Sadece outcomeCodes alanı içeren JSON üret.");
        return sb.ToString();
    }

    private static DraftFields ParseDraft(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        return new DraftFields(
            Title: ReadString(root, "title"),
            Description: ReadString(root, "description"),
            Subject: ReadString(root, "subject"),
            GradeLevel: ReadInt(root, "gradeLevel"),
            DurationMinutes: ReadInt(root, "durationMinutes"),
            Difficulty: NormalizeDifficulty(ReadString(root, "difficulty")),
            Tags: ReadStringArray(root, "tags")
                .Select(t => t.Trim().ToLowerInvariant())
                .Where(t => !string.IsNullOrEmpty(t))
                .Distinct()
                .Take(7)
                .ToList(),
            Confidence: ReadDouble(root, "confidence") ?? 0.0);
    }

    private static IReadOnlyList<string> ParseOutcomes(string json, IReadOnlyList<CatalogOutcomeDto> catalog)
    {
        var validCodes = catalog.Select(o => o.Code).ToHashSet(StringComparer.OrdinalIgnoreCase);
        using var doc = JsonDocument.Parse(json);
        return ReadStringArray(doc.RootElement, "outcomeCodes")
            .Where(c => validCodes.Contains(c))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();
    }

    private static string? ReadString(JsonElement root, string name)
    {
        if (!root.TryGetProperty(name, out var v)) return null;
        if (v.ValueKind != JsonValueKind.String) return null;
        var s = v.GetString();
        return string.IsNullOrWhiteSpace(s) ? null : s.Trim();
    }

    private static int? ReadInt(JsonElement root, string name)
    {
        if (!root.TryGetProperty(name, out var v)) return null;
        return v.ValueKind switch
        {
            JsonValueKind.Number when v.TryGetInt32(out var i) => i,
            JsonValueKind.String when int.TryParse(v.GetString(), out var i) => i,
            _ => null,
        };
    }

    private static double? ReadDouble(JsonElement root, string name)
    {
        if (!root.TryGetProperty(name, out var v)) return null;
        return v.ValueKind switch
        {
            JsonValueKind.Number when v.TryGetDouble(out var d) => d,
            JsonValueKind.String when double.TryParse(v.GetString(), System.Globalization.CultureInfo.InvariantCulture, out var d) => d,
            _ => null,
        };
    }

    private static IEnumerable<string> ReadStringArray(JsonElement root, string name)
    {
        if (!root.TryGetProperty(name, out var v) || v.ValueKind != JsonValueKind.Array) yield break;
        foreach (var item in v.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.String)
            {
                var s = item.GetString();
                if (!string.IsNullOrWhiteSpace(s)) yield return s.Trim();
            }
        }
    }

    private static string? NormalizeDifficulty(string? v) => v?.Trim().ToLowerInvariant() switch
    {
        "easy" or "kolay" => "Easy",
        "medium" or "orta" => "Medium",
        "hard" or "zor" => "Hard",
        _ => null,
    };

    private sealed record DraftFields(
        string? Title,
        string? Description,
        string? Subject,
        int? GradeLevel,
        int? DurationMinutes,
        string? Difficulty,
        IReadOnlyList<string> Tags,
        double Confidence);

    private sealed record ChatRequest
    {
        [JsonPropertyName("model")] public required string Model { get; init; }
        [JsonPropertyName("temperature")] public decimal Temperature { get; init; }
        [JsonPropertyName("response_format")] public ResponseFormat? ResponseFormat { get; init; }
        [JsonPropertyName("messages")] public required IReadOnlyList<ChatMessage> Messages { get; init; }
    }

    private sealed record ChatMessage(
        [property: JsonPropertyName("role")] string Role,
        [property: JsonPropertyName("content")] string Content);

    private sealed record ResponseFormat(
        [property: JsonPropertyName("type")] string Type);
}
