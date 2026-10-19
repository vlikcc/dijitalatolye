using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace DijitalAtolye.AIModeration.API.Llm;

/// <summary>
/// EVREN LLM (OpenAI uyumlu, https://evren-llmapi.ssyz.org.tr) istemcisi. JSON modu zorlanır
/// (response_format = "json_object") ve düşünme kapatılır. Filodaki modellerin bazıları zaman zaman
/// "sağlıklı endpoint yok" (503) döndüğünden <see cref="LlmProviderOptions.EvrenModels"/> sırayla denenir;
/// anahtar hatası (401/403) ise hemen yükseltilir çünkü diğer modellerde de değişmez.
/// </summary>
public sealed class EvrenProvider : ILlmProvider
{
    public string Name => "evren";

    /// <summary>Son başarılı çağrının modeli; çağrı öncesi listedeki ilk model.</summary>
    public string Model { get; private set; }

    private readonly HttpClient _http;
    private readonly LlmProviderOptions _options;
    private readonly ILogger<EvrenProvider> _logger;

    public EvrenProvider(HttpClient http, IOptions<LlmProviderOptions> options, ILogger<EvrenProvider> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
        _http.BaseAddress ??= new Uri(_options.EvrenEndpoint.TrimEnd('/') + "/");
        if (!string.IsNullOrWhiteSpace(_options.EvrenApiKey))
        {
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _options.EvrenApiKey);
        }
        Model = _options.EvrenModelList.FirstOrDefault() ?? string.Empty;
    }

    public async Task<LlmResponse> CompleteJsonAsync(string systemPrompt, string userPrompt, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.EvrenApiKey))
            throw new InvalidOperationException("EVREN API anahtarı tanımlı değil (Llm:EvrenApiKey).");
        var models = _options.EvrenModelList;
        if (models.Count == 0)
            throw new InvalidOperationException("EVREN model listesi boş (Llm:EvrenModels).");

        Exception? last = null;
        foreach (var model in models)
        {
            try
            {
                var response = await CompleteWithModelAsync(model, systemPrompt, userPrompt, ct);
                Model = model;
                return response;
            }
            catch (EvrenModelUnavailableException ex)
            {
                _logger.LogWarning("EVREN modeli kullanılamadı, sıradaki deneniyor: model={Model} ({Reason})", model, ex.Message);
                last = ex;
            }
        }
        throw new InvalidOperationException($"EVREN modellerinin hiçbiri yanıt vermedi: {string.Join(", ", models)}", last);
    }

    private async Task<LlmResponse> CompleteWithModelAsync(string model, string systemPrompt, string userPrompt, CancellationToken ct)
    {
        var request = new ChatRequest
        {
            Model = model,
            Temperature = 0.1m,
            MaxTokens = _options.EvrenMaxTokens,
            ResponseFormat = new ResponseFormat("json_object"),
            // DeepSeek "thinking", Qwen "enable_thinking" okur; tanımayan şablon yok sayar.
            ChatTemplateKwargs = new Dictionary<string, object> { ["thinking"] = false, ["enable_thinking"] = false },
            Messages =
            [
                new ChatMessage("system", systemPrompt),
                new ChatMessage("user", userPrompt),
            ],
        };

        HttpResponseMessage response;
        try
        {
            response = await _http.PostAsJsonAsync("chat/completions", request, ct);
        }
        catch (Exception ex) when (!ct.IsCancellationRequested)
        {
            // Ağ hatası, zaman aşımı veya resilience handler reddi (TimeoutRejected/BrokenCircuit).
            throw new EvrenModelUnavailableException(ex.Message, ex);
        }

        using (response)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("EVREN API error {Status} (model={Model}): {Body}", response.StatusCode, model, body);
                if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                    throw new InvalidOperationException($"EVREN API anahtarı geçersiz veya yetkisiz ({(int)response.StatusCode}).");
                throw new EvrenModelUnavailableException($"HTTP {(int)response.StatusCode}");
            }

            using var doc = JsonDocument.Parse(body);
            var content = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();
            if (string.IsNullOrWhiteSpace(content))
                throw new EvrenModelUnavailableException("boş yanıt");

            var (promptTokens, completionTokens) = (0, 0);
            if (doc.RootElement.TryGetProperty("usage", out var usage) && usage.ValueKind == JsonValueKind.Object)
            {
                promptTokens = usage.TryGetProperty("prompt_tokens", out var p) && p.TryGetInt32(out var pt) ? pt : 0;
                completionTokens = usage.TryGetProperty("completion_tokens", out var c) && c.TryGetInt32(out var cpt) ? cpt : 0;
            }

            _logger.LogInformation("EVREN call ok: model={Model}, prompt={Prompt}, completion={Completion}",
                model, promptTokens, completionTokens);

            // EVREN kamu altyapısı; token başı ücret yok.
            return new LlmResponse(content, promptTokens, completionTokens, 0m);
        }
    }

    private sealed class EvrenModelUnavailableException(string message, Exception? inner = null) : Exception(message, inner);

    private sealed record ChatRequest
    {
        [JsonPropertyName("model")] public required string Model { get; init; }
        [JsonPropertyName("temperature")] public decimal Temperature { get; init; }
        [JsonPropertyName("max_tokens")] public int MaxTokens { get; init; }
        [JsonPropertyName("response_format")] public ResponseFormat? ResponseFormat { get; init; }
        [JsonPropertyName("chat_template_kwargs")] public Dictionary<string, object>? ChatTemplateKwargs { get; init; }
        [JsonPropertyName("messages")] public required IReadOnlyList<ChatMessage> Messages { get; init; }
    }

    private sealed record ChatMessage([property: JsonPropertyName("role")] string Role,
                                      [property: JsonPropertyName("content")] string Content);

    private sealed record ResponseFormat([property: JsonPropertyName("type")] string Type);
}
