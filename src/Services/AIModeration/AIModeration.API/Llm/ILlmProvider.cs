namespace DijitalAtolye.AIModeration.API.Llm;

/// <summary>
/// LLM sağlayıcı soyutlaması. DeepSeek primary; Gemini/Claude fallback olabilir.
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
