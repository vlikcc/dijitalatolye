namespace DijitalAtolye.AIModeration.API.StaticAnalysis;

public interface IStaticAnalyzer
{
    Task<StaticAnalysisReport> AnalyzeAsync(string entryHtml, IReadOnlyDictionary<string, string> jsFiles, CancellationToken ct = default);
}

public sealed record StaticAnalysisReport(
    IReadOnlyList<string> CriticalIssues,
    IReadOnlyList<string> Warnings,
    IReadOnlyList<string> ExternalUrls,
    string SuggestedCsp);
