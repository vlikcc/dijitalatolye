using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace DijitalAtolye.AIModeration.API.Llm;

/// <summary>
/// OpenAI uyumlu DeepSeek Chat Completions API istemcisi.
/// JSON modu zorlanmış, response_format = "json_object".
/// </summary>
public sealed class DeepSeekProvider : ILlmProvider
{
    public string Name => "deepseek";
    public string Model => _options.DeepSeekModel;

    private readonly HttpClient _http;
    private readonly LlmProviderOptions _options;
    private readonly ILogger<DeepSeekProvider> _logger;

    public DeepSeekProvider(HttpClient http, IOptions<LlmProviderOptions> options, ILogger<DeepSeekProvider> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
        _http.BaseAddress = new Uri(_options.DeepSeekEndpoint.TrimEnd('/') + "/");
        if (!string.IsNullOrWhiteSpace(_options.DeepSeekApiKey))
        {
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _options.DeepSeekApiKey);
        }
    }

    public async Task<LlmResponse> CompleteJsonAsync(string systemPrompt, string userPrompt, CancellationToken ct = default)
    {
        var request = new ChatRequest
        {
            Model = _options.DeepSeekModel,
            Temperature = 0.1m,
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

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? "{}";
        var usage = doc.RootElement.GetProperty("usage");
        var promptTokens = usage.GetProperty("prompt_tokens").GetInt32();
        var completionTokens = usage.GetProperty("completion_tokens").GetInt32();
        var cost = (promptTokens / 1000m) * _options.DeepSeekInputCostPer1KTokens
                 + (completionTokens / 1000m) * _options.DeepSeekOutputCostPer1KTokens;

        _logger.LogInformation("DeepSeek call ok: prompt={Prompt}, completion={Completion}, cost~${Cost}",
            promptTokens, completionTokens, cost);

        return new LlmResponse(content, promptTokens, completionTokens, cost);
    }

    private sealed record ChatRequest
    {
        [JsonPropertyName("model")] public required string Model { get; init; }
        [JsonPropertyName("temperature")] public decimal Temperature { get; init; }
        [JsonPropertyName("response_format")] public ResponseFormat? ResponseFormat { get; init; }
        [JsonPropertyName("messages")] public required IReadOnlyList<ChatMessage> Messages { get; init; }
    }

    private sealed record ChatMessage([property: JsonPropertyName("role")] string Role,
                                      [property: JsonPropertyName("content")] string Content);

    private sealed record ResponseFormat([property: JsonPropertyName("type")] string Type);
}
