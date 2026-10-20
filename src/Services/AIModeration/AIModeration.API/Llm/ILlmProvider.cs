namespace DijitalAtolye.AIModeration.API.Llm;

/// <summary>
/// LLM sağlayıcı soyutlaması. Llm:Provider ile EVREN (varsayılan) veya DeepSeek seçilir.
/// </summary>
public interface ILlmProvider
{
    string Name { get; }
    string Model { get; }
    Task<LlmResponse> CompleteJsonAsync(string systemPrompt, string userPrompt, CancellationToken ct = default);
}

public sealed record LlmResponse(
    string RawJson,
    int PromptTokens,
    int CompletionTokens,
    decimal EstimatedCostUsd);

public sealed class LlmProviderOptions
{
    /// <summary>Moderasyonda kullanılan sağlayıcı: "evren" veya "deepseek".</summary>
    public string Provider { get; set; } = "evren";

    public string EvrenApiKey { get; set; } = string.Empty;
    public string EvrenEndpoint { get; set; } = "https://evren-llmapi.ssyz.org.tr/v1";

    /// <summary>Virgülle ayrılmış, öncelik sırasıyla denenecek EVREN modelleri.</summary>
    public string EvrenModels { get; set; } = "deepseek-v4.1-flash,glm-5.3,qwen3.8-flash-next";
    public int EvrenMaxTokens { get; set; } = 2048;

    public IReadOnlyList<string> EvrenModelList =>
        EvrenModels.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    public bool UsesEvren => string.Equals(Provider, "evren", StringComparison.OrdinalIgnoreCase);

    public string DeepSeekApiKey { get; set; } = string.Empty;
    public string DeepSeekModel { get; set; } = "deepseek-chat";
    public string DeepSeekEndpoint { get; set; } = "https://api.deepseek.com/v1";
    public decimal DeepSeekInputCostPer1KTokens { get; set; } = 0.00014m;
    public decimal DeepSeekOutputCostPer1KTokens { get; set; } = 0.00028m;
    public string? GeminiApiKey { get; set; }
    public string GeminiModel { get; set; } = "gemini-2.0-flash";
    public string? AnthropicApiKey { get; set; }
    public string AnthropicModel { get; set; } = "claude-3-5-sonnet-latest";
}
