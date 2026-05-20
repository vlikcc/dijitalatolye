using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Moderation;

namespace DijitalAtolye.AIModeration.API.Pipeline;

public static class ModerationDecisionRules
{
    public static ModerationDecision Decide(int score, int criticalCount) =>
        criticalCount > 0 ? ModerationDecision.AutoReject :
        score >= 85 ? ModerationDecision.AutoApproveCandidate :
        score >= 60 ? ModerationDecision.NeedsReview :
        score >= 35 ? ModerationDecision.FlaggedForReview :
        ModerationDecision.AutoReject;
}
