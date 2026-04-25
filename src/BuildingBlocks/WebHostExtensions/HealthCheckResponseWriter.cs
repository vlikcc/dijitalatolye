using System.Text.Json;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace DijitalAtolye.BuildingBlocks.WebHostExtensions;

internal static class HealthCheckResponseWriter
{
    public static Task WriteResponse(HttpContext context, HealthReport report) =>
        UIResponseWriter.WriteHealthCheckUIResponse(context, report);
}
