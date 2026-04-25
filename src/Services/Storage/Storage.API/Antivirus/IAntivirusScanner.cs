namespace DijitalAtolye.Storage.API.Antivirus;

public interface IAntivirusScanner
{
    Task<ScanResult> ScanAsync(Stream content, CancellationToken ct = default);
}

public sealed record ScanResult(bool IsClean, string? VirusName, string Engine);
