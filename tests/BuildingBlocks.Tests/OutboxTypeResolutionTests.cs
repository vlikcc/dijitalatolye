using System.Reflection;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Content;
using FluentAssertions;

namespace DijitalAtolye.BuildingBlocks.Tests;

public sealed class OutboxTypeResolutionTests
{
    [Fact]
    public void ResolveType_finds_event_from_EventBus_contracts_assembly()
    {
        var fullName = typeof(ContentSubmittedV1).FullName!;
        var type = InvokeResolveType(fullName);

        type.Should().NotBeNull();
        type.Should().Be(typeof(ContentSubmittedV1));
    }

    [Fact]
    public void ResolveType_returns_null_for_unknown_type()
    {
        InvokeResolveType("Nonexistent.Namespace.FakeEvent, FakeAssembly")
            .Should().BeNull();
    }

    private static Type? InvokeResolveType(string fullName)
    {
        var closed = typeof(DijitalAtolye.BuildingBlocks.Outbox.OutboxDispatcher<>)
            .MakeGenericType(typeof(Microsoft.EntityFrameworkCore.DbContext));
        var method = closed.GetMethod("ResolveType", BindingFlags.NonPublic | BindingFlags.Static)
            ?? throw new InvalidOperationException("ResolveType not found");
        return (Type?)method.Invoke(null, [fullName]);
    }
}
