using DijitalAtolye.BuildingBlocks.Common.ApiResponses;
using DijitalAtolye.BuildingBlocks.Common.Results;
using FluentAssertions;
using Microsoft.AspNetCore.Http;

namespace DijitalAtolye.BuildingBlocks.Tests;

public sealed class ApiResultTests
{
    [Fact]
    public void ToProblemDetails_maps_validation_to_400()
    {
        var error = Error.Validation("field", "required");
        var problem = ApiResultExtensions.ToProblemDetails(error);

        problem.Status.Should().Be(StatusCodes.Status400BadRequest);
        problem.Detail.Should().Be("required");
    }

    [Fact]
    public void ToProblemDetails_maps_not_found_to_404()
    {
        var error = Error.NotFound("Content", "missing");
        var problem = ApiResultExtensions.ToProblemDetails(error);

        problem.Status.Should().Be(StatusCodes.Status404NotFound);
    }
}
