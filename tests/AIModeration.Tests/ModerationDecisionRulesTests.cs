using DijitalAtolye.AIModeration.API.Pipeline;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Moderation;
using FluentAssertions;

namespace DijitalAtolye.AIModeration.Tests;

public sealed class ModerationDecisionRulesTests
{
    [Theory]
    [InlineData(90, 1, ModerationDecision.AutoReject)]
    [InlineData(90, 0, ModerationDecision.AutoApproveCandidate)]
    [InlineData(70, 0, ModerationDecision.NeedsReview)]
    [InlineData(40, 0, ModerationDecision.FlaggedForReview)]
    [InlineData(20, 0, ModerationDecision.AutoReject)]
    public void Decide_applies_score_and_critical_matrix(int score, int critical, ModerationDecision expected)
    {
        ModerationDecisionRules.Decide(score, critical).Should().Be(expected);
    }
}
