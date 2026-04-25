using nClam;

namespace DijitalAtolye.Storage.API.Antivirus;

public sealed class ClamAvScanner : IAntivirusScanner
{
    private readonly IClamClient _client;
    private readonly ILogger<ClamAvScanner> _logger;

    public ClamAvScanner(IClamClient client, ILogger<ClamAvScanner> logger)
    {
        _client = client;
        _logger = logger;
    }

    public async Task<ScanResult> ScanAsync(Stream content, CancellationToken ct = default)
    {
        try
        {
            var result = await _client.SendAndScanFileAsync(content, ct);
            return result.Result switch
            {
                ClamScanResults.Clean => new ScanResult(true, null, "ClamAV"),
                ClamScanResults.VirusDetected => new ScanResult(false, result.InfectedFiles?.FirstOrDefault()?.VirusName, "ClamAV"),
                ClamScanResults.Error => throw new InvalidOperationException($"ClamAV error: {result.RawResult}"),
                ClamScanResults.Unknown => new ScanResult(false, "unknown", "ClamAV"),
                _ => new ScanResult(false, "unknown_state", "ClamAV"),
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ClamAV scan failed");
            throw;
        }
    }
}
