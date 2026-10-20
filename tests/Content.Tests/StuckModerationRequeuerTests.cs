using DijitalAtolye.Content.API.Consumers;
using DijitalAtolye.Content.API.Domain;
using FluentAssertions;

namespace Content.Tests;

public sealed class StuckModerationRequeuerTests
{
    private static readonly DateTime Now = new(2026, 10, 20, 12, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Cutoff = Now.AddMinutes(-20);

    [Theory]
    [InlineData(ContentState.Submitted, -60, 0, true)]   // uzun süredir takılı
    [InlineData(ContentState.Submitted, -60, 4, true)]   // son deneme hakkı
    [InlineData(ContentState.Submitted, -60, 5, false)]  // deneme sınırı doldu
    [InlineData(ContentState.Submitted, -5, 0, false)]   // moderasyon hâlâ sürüyor olabilir
    [InlineData(ContentState.GuardScanning, -60, 0, false)]
    [InlineData(ContentState.EditorReviewing, -60, 0, false)]
    [InlineData(ContentState.AutoRejected, -60, 0, false)]
    public void Selects_only_long_stuck_submitted_content_under_attempt_limit(
        ContentState state, int updatedMinutesAgo, int attempts, bool expected)
    {
        var content = new DijitalAtolye.Content.API.Domain.Content
        {
            AuthorUserId = Guid.NewGuid(),
            Title = "Oyun",
            State = state,
            UpdatedAtUtc = Now.AddMinutes(updatedMinutesAgo),
            ModerationRequeueCount = attempts,
        };

        var isStuck = StuckModerationRequeuer.IsStuck(Cutoff, maxAttempts: 5).Compile();

        isStuck(content).Should().Be(expected);
    }
}
