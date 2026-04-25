using DijitalAtolye.BuildingBlocks.Common.Results;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using HttpResults = Microsoft.AspNetCore.Http.Results;

namespace DijitalAtolye.BuildingBlocks.Common.ApiResponses;

/// <summary>
/// <see cref="Result"/> ve <see cref="Result{T}"/> tiplerini RFC 7807 ProblemDetails
/// üzerinden HTTP yanıtlarına dönüştürür.
/// </summary>
public static class ApiResultExtensions
{
    public static IResult ToHttpResult(this Result result, int successStatusCode = StatusCodes.Status200OK) =>
        result.IsSuccess
            ? HttpResults.StatusCode(successStatusCode)
            : HttpResults.Problem(ToProblemDetails(result.Error));

    public static IResult ToHttpResult<T>(this Result<T> result, int successStatusCode = StatusCodes.Status200OK) =>
        result.IsSuccess
            ? HttpResults.Json(result.Value, statusCode: successStatusCode)
            : HttpResults.Problem(ToProblemDetails(result.Error));

    public static IResult ToCreatedResult<T>(this Result<T> result, string locationPath, object? routeValues = null) =>
        result.IsSuccess
            ? HttpResults.Created(locationPath, result.Value)
            : HttpResults.Problem(ToProblemDetails(result.Error));

    public static ProblemDetails ToProblemDetails(Error error)
    {
        var (status, title) = error.Type switch
        {
            ErrorType.Validation => (StatusCodes.Status400BadRequest, "Validation Failed"),
            ErrorType.NotFound => (StatusCodes.Status404NotFound, "Not Found"),
            ErrorType.Conflict => (StatusCodes.Status409Conflict, "Conflict"),
            ErrorType.Unauthorized => (StatusCodes.Status401Unauthorized, "Unauthorized"),
            ErrorType.Forbidden => (StatusCodes.Status403Forbidden, "Forbidden"),
            ErrorType.Failure => (StatusCodes.Status400BadRequest, "Operation Failed"),
            ErrorType.Unexpected => (StatusCodes.Status500InternalServerError, "Unexpected Error"),
            ErrorType.None => (StatusCodes.Status200OK, "OK"),
            _ => (StatusCodes.Status500InternalServerError, "Unexpected Error"),
        };

        return new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = error.Message,
            Type = $"https://docs.dijitalatolye.tr/errors/{error.Code}",
            Extensions = { ["code"] = error.Code },
        };
    }
}
