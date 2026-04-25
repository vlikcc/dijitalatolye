using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Moderation;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DijitalAtolye.AIModeration.API.Persistence;

[BsonIgnoreExtraElements]
public sealed class ModerationReport
{
    [BsonId]
    public Guid Id { get; init; } = Guid.NewGuid();

    [BsonRepresentation(BsonType.String)]
    public Guid ContentId { get; init; }

    [BsonRepresentation(BsonType.String)]
    public Guid VersionId { get; init; }

    public DateTime AnalyzedAtUtc { get; init; } = DateTime.UtcNow;

    public string ProviderName { get; init; } = "deepseek";
    public string ProviderModel { get; init; } = "deepseek-chat";

    public int Score { get; init; }

    [BsonRepresentation(BsonType.String)]
    public ModerationDecision Decision { get; init; }

    public List<string> CriticalFlags { get; init; } = [];
    public List<string> Warnings { get; init; } = [];
    public List<string> ExternalUrls { get; init; } = [];
    public string SuggestedCsp { get; init; } = string.Empty;

    public string LlmRawJson { get; init; } = "{}";

    public int PromptTokens { get; init; }
    public int CompletionTokens { get; init; }
    public decimal EstimatedCostUsd { get; init; }

    public string? ErrorMessage { get; init; }
}
