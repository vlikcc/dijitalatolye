using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.Content.API.Domain;
using DijitalAtolye.Content.API.Endpoints;
using FluentAssertions;

namespace DijitalAtolye.Content.Tests;

public sealed class ContentAccessTests
{
    private static readonly Guid AuthorId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid OtherId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    [Theory]
    [InlineData(ContentState.Draft, Roles.Teacher, true, true)]
    [InlineData(ContentState.Draft, Roles.Admin, false, true)]
    [InlineData(ContentState.Draft, Roles.Teacher, false, false)]
    [InlineData(ContentState.Published, Roles.Student, false, true)]
    [InlineData(ContentState.Draft, Roles.Student, false, false)]
    [InlineData(ContentState.EditorReviewing, Roles.Editor, false, true)]
    public void CanReadContent_respects_author_role_and_state(
        ContentState state,
        string role,
        bool isAuthor,
        bool expected)
    {
        var userId = isAuthor ? AuthorId : OtherId;
        var current = new FakeCurrentUser(userId, [role]);
        var content = new DijitalAtolye.Content.API.Domain.Content
        {
            AuthorUserId = AuthorId,
            Title = "Test",
            State = state,
        };

        ContentEndpoints.CanReadContent(content, current).Should().Be(expected);
    }

    private sealed class FakeCurrentUser(Guid? userId, string[] roles) : ICurrentUser
    {
        public Guid? UserId => userId;
        public string? Email => null;
        public string? DisplayName => null;
        public bool IsAuthenticated => userId.HasValue;
        public IReadOnlyCollection<string> Roles => roles;
        public bool IsInRole(string role) => roles.Contains(role);
    }
}
