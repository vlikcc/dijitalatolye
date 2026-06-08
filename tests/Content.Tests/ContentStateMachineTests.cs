using DijitalAtolye.Content.API.Domain;
using FluentAssertions;

namespace Content.Tests;

public sealed class ContentStateMachineTests
{
    [Theory]
    [InlineData(ContentState.Draft, ContentState.GuardScanning, true)]
    [InlineData(ContentState.Draft, ContentState.Submitted, true)]
    [InlineData(ContentState.GuardScanning, ContentState.Submitted, true)]
    [InlineData(ContentState.GuardScanning, ContentState.AutoRejected, true)]
    [InlineData(ContentState.Draft, ContentState.AIReviewing, false)]
    [InlineData(ContentState.GuardScanning, ContentState.AIReviewing, false)]
    public void CanTransitionTo_respects_guard_first_flow(ContentState from, ContentState to, bool expected)
    {
        var content = CreateContent(from);
        content.CanTransitionTo(to).Should().Be(expected);
    }

    [Fact]
    public void TransitionTo_throws_on_invalid_guard_scanning_skip()
    {
        var content = CreateContent(ContentState.Draft);
        var act = () => content.TransitionTo(ContentState.AIReviewing);
        act.Should().Throw<InvalidOperationException>();
    }

    private static DijitalAtolye.Content.API.Domain.Content CreateContent(ContentState state)
    {
        var content = new DijitalAtolye.Content.API.Domain.Content
        {
            AuthorUserId = Guid.NewGuid(),
            Title = "Test",
        };
        content.State = state;
        return content;
    }
}

public sealed class GuardScanStatusesTests
{
    [Theory]
    [InlineData("clean", true)]
    [InlineData("CLEAN", true)]
    [InlineData("manual_review", false)]
    [InlineData("yara_manual_review", false)]
    [InlineData("scanning", false)]
    public void IsCleanForAiModeration_only_allows_clean(string status, bool expected) =>
        GuardScanStatuses.IsCleanForAiModeration(status).Should().Be(expected);

    [Theory]
    [InlineData("clamav_infected", true)]
    [InlineData("policy_rejected", true)]
    [InlineData("clean", false)]
    public void IsRejected_detects_guard_failures(string status, bool expected) =>
        GuardScanStatuses.IsRejected(status).Should().Be(expected);
}
