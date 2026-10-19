using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace DijitalAtolye.Content.API.Studio;

/// <summary>EVREN LLM (OpenAI uyumlu) istemcisi. Anahtar istek başına verilir; platform ve kullanıcı anahtarı aynı istemciyi kullanır.</summary>
public interface IEvrenChatClient
{
    /// <summary>Akışlı (SSE) chat completion. <paramref name="onProgress"/> biriken içerik uzunluğuyla çağrılır.</summary>
    Task<ChatCompletionResult> CompleteAsync(
        string apiKey,
        string model,
        IReadOnlyList<StudioChatMessage> messages,
        Func<int, Task>? onProgress,
        CancellationToken ct);

    /// <summary>Anahtarın görebildiği model kimlikleri. Anahtar doğrulaması için de kullanılır.</summary>
    Task<IReadOnlyList<string>> ListModelsAsync(string apiKey, CancellationToken ct);
}

public sealed record StudioChatMessage(
    [property: JsonPropertyName("role")] string Role,
    [property: JsonPropertyName("content")] string Content);

public sealed record ChatCompletionResult(string Content, int PromptTokens, int CompletionTokens, string? FinishReason);

/// <summary>EVREN hata yanıtı. <see cref="StatusCode"/> 401/403 → anahtar geçersiz, 429 → kota/hız sınırı.</summary>
public sealed class EvrenApiException(HttpStatusCode statusCode, string message, string? code = null) : Exception(message)
{
    public const string TermsNotAcceptedCode = "terms_not_accepted";

    public HttpStatusCode StatusCode { get; } = statusCode;

    /// <summary>EVREN hata kodu (ör. <c>terms_not_accepted</c>, <c>unauthorized</c>).</summary>
    public string? Code { get; } = code;

    public bool IsTermsNotAccepted => Code == TermsNotAcceptedCode;

    public bool IsAuthError => StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden;

    public bool IsRateLimited => StatusCode == HttpStatusCode.TooManyRequests;
}

public sealed class EvrenChatClient : IEvrenChatClient
{
    private static readonly TimeSpan ProgressInterval = TimeSpan.FromSeconds(2);

    private readonly HttpClient _http;
    private readonly StudioOptions _options;
    private readonly ILogger<EvrenChatClient> _logger;

    public EvrenChatClient(HttpClient http, IOptions<StudioOptions> options, ILogger<EvrenChatClient> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
        _http.BaseAddress ??= new Uri(_options.BaseUrl.TrimEnd('/') + "/");
    }

    public async Task<ChatCompletionResult> CompleteAsync(
        string apiKey,
        string model,
        IReadOnlyList<StudioChatMessage> messages,
        Func<int, Task>? onProgress,
        CancellationToken ct)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(TimeSpan.FromSeconds(_options.TimeoutSeconds));

        var payload = new ChatRequest
        {
            Model = model,
            Messages = messages,
            Temperature = _options.Temperature,
            MaxTokens = _options.MaxOutputTokens,
            Stream = true,
            StreamOptions = new StreamOptions(IncludeUsage: true),
            // DeepSeek "thinking", Qwen "enable_thinking" okur; tanımayan şablon yok sayar.
            ChatTemplateKwargs = _options.DisableThinking
                ? new Dictionary<string, object> { ["thinking"] = false, ["enable_thinking"] = false }
                : null,
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "chat/completions")
        {
            Content = JsonContent.Create(payload),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/event-stream"));

        using var response = await _http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
        await EnsureSuccessAsync(response, timeout.Token);

        await using var stream = await response.Content.ReadAsStreamAsync(timeout.Token);
        using var reader = new StreamReader(stream, Encoding.UTF8);
        var acc = new ChatStreamAccumulator();
        var lastReport = DateTime.UtcNow;

        while (await reader.ReadLineAsync(timeout.Token) is { } line)
        {
            if (!acc.Accept(line)) break;
            if (onProgress is not null && DateTime.UtcNow - lastReport >= ProgressInterval)
            {
                lastReport = DateTime.UtcNow;
                await onProgress(acc.ContentLength);
            }
        }

        _logger.LogInformation("EVREN çağrısı tamamlandı: model={Model}, prompt={Prompt}, completion={Completion}, finish={Finish}",
            model, acc.PromptTokens, acc.CompletionTokens, acc.FinishReason);

        return new ChatCompletionResult(acc.Content, acc.PromptTokens, acc.CompletionTokens, acc.FinishReason);
    }

    public async Task<IReadOnlyList<string>> ListModelsAsync(string apiKey, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "models");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(TimeSpan.FromSeconds(15));

        using var response = await _http.SendAsync(request, timeout.Token);
        await EnsureSuccessAsync(response, timeout.Token);

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(timeout.Token));
        if (!doc.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
            return [];
        return data.EnumerateArray()
            .Select(m => m.TryGetProperty("id", out var id) ? id.GetString() : null)
            .OfType<string>()
            .ToList();
    }

    private async Task EnsureSuccessAsync(HttpResponseMessage response, CancellationToken ct)
    {
        if (response.IsSuccessStatusCode) return;

        var body = await response.Content.ReadAsStringAsync(ct);
        var (apiMessage, apiCode) = TryReadError(body);
        _logger.LogWarning("EVREN API hatası {Status} ({Code}): {Message}",
            (int)response.StatusCode, apiCode, apiMessage ?? Truncate(body, 300));

        var message = apiCode == EvrenApiException.TermsNotAcceptedCode
            ? "Bu EVREN anahtarının hesabı, EVREN kullanım şartlarını henüz kabul etmemiş. Şartları EVREN portalında kabul edip tekrar deneyin."
            : response.StatusCode switch
            {
                HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden => "EVREN API anahtarı geçersiz veya yetkisiz.",
                HttpStatusCode.TooManyRequests => "EVREN kota veya hız sınırına ulaşıldı. Bir süre sonra tekrar deneyin.",
                _ => $"EVREN API hatası ({(int)response.StatusCode}){(apiMessage is null ? "" : ": " + apiMessage)}",
            };
        throw new EvrenApiException(response.StatusCode, message, apiCode);
    }

    private static (string? Message, string? Code) TryReadError(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (!doc.RootElement.TryGetProperty("error", out var err) || err.ValueKind != JsonValueKind.Object)
                return (null, null);
            var message = err.TryGetProperty("message", out var msg) ? msg.GetString() : null;
            var code = err.TryGetProperty("code", out var c) && c.ValueKind == JsonValueKind.String ? c.GetString() : null;
            return (message, code);
        }
        catch (JsonException)
        {
            return (null, null);
        }
    }

    private static string Truncate(string value, int max) => value.Length <= max ? value : value[..max];

    private sealed record ChatRequest
    {
        [JsonPropertyName("model")] public required string Model { get; init; }
        [JsonPropertyName("messages")] public required IReadOnlyList<StudioChatMessage> Messages { get; init; }
        [JsonPropertyName("temperature")] public double Temperature { get; init; }
        [JsonPropertyName("max_tokens")] public int MaxTokens { get; init; }
        [JsonPropertyName("stream")] public bool Stream { get; init; }
        [JsonPropertyName("stream_options")] public StreamOptions? StreamOptions { get; init; }
        [JsonPropertyName("chat_template_kwargs")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Dictionary<string, object>? ChatTemplateKwargs { get; init; }
    }

    private sealed record StreamOptions([property: JsonPropertyName("include_usage")] bool IncludeUsage);
}

/// <summary>
/// OpenAI uyumlu SSE akışını satır satır biriktirir. Düşünme (reasoning) içeriği atılır; yalnızca
/// <c>delta.content</c> toplanır. <c>[DONE]</c> görülünce <see cref="Accept"/> false döner.
/// </summary>
public sealed class ChatStreamAccumulator
{
    private readonly StringBuilder _content = new();

    public string Content => _content.ToString();
    public int ContentLength => _content.Length;
    public int PromptTokens { get; private set; }
    public int CompletionTokens { get; private set; }
    public string? FinishReason { get; private set; }

    public bool Accept(string line)
    {
        if (!line.StartsWith("data:", StringComparison.Ordinal)) return true; // boş satır, yorum, event: vb.
        var data = line[5..].Trim();
        if (data.Length == 0) return true;
        if (data == "[DONE]") return false;

        JsonDocument doc;
        try
        {
            doc = JsonDocument.Parse(data);
        }
        catch (JsonException)
        {
            return true; // bozuk chunk'ı atla; akış devam eder
        }

        using (doc)
        {
            var root = doc.RootElement;
            if (root.TryGetProperty("choices", out var choices) && choices.ValueKind == JsonValueKind.Array)
            {
                foreach (var choice in choices.EnumerateArray())
                {
                    if (choice.TryGetProperty("delta", out var delta)
                        && delta.TryGetProperty("content", out var c)
                        && c.ValueKind == JsonValueKind.String)
                    {
                        _content.Append(c.GetString());
                    }
                    if (choice.TryGetProperty("finish_reason", out var fr) && fr.ValueKind == JsonValueKind.String)
                    {
                        FinishReason = fr.GetString();
                    }
                }
            }
            if (root.TryGetProperty("usage", out var usage) && usage.ValueKind == JsonValueKind.Object)
            {
                if (usage.TryGetProperty("prompt_tokens", out var p) && p.TryGetInt32(out var pt)) PromptTokens = pt;
                if (usage.TryGetProperty("completion_tokens", out var q) && q.TryGetInt32(out var qt)) CompletionTokens = qt;
            }
        }
        return true;
    }
}
