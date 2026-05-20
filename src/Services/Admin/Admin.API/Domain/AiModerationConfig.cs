namespace DijitalAtolye.Admin.API.Domain;

public sealed class AiModerationConfig
{
    public int Id { get; set; } = 1;
    public string PrimaryProvider { get; set; } = "DeepSeek";
    public string? FallbackProvider { get; set; }
    public string Model { get; set; } = "deepseek-chat";
    public int MaxTokens { get; set; } = 2048;
    public string PromptVersion { get; set; } = "v2";
    public bool StaticAnalysisEnabled { get; set; } = true;
    public bool LlmEnabled { get; set; } = true;
    public decimal DailyCostLimitUsd { get; set; } = 50m;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
