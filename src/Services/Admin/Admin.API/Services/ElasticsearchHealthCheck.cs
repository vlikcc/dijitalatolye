using Elastic.Clients.Elasticsearch;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace DijitalAtolye.Admin.API.Services;

/// <summary>Readiness: Elasticsearch cluster'ına ping atar.</summary>
public sealed class ElasticsearchHealthCheck(ElasticsearchClient client) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var ping = await client.PingAsync(cancellationToken);
            return ping.IsValidResponse
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy("Elasticsearch ping başarısız.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Elasticsearch erişilemiyor.", ex);
        }
    }
}
