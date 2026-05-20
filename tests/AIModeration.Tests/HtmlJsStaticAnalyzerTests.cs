using DijitalAtolye.AIModeration.API.StaticAnalysis;
using FluentAssertions;

namespace DijitalAtolye.AIModeration.Tests;

public sealed class HtmlJsStaticAnalyzerTests
{
    private readonly HtmlJsStaticAnalyzer _analyzer = new();

    [Fact]
    public async Task AnalyzeAsync_flags_eval_as_critical()
    {
        var html = "<html><body><script>eval('1')</script></body></html>";
        var report = await _analyzer.AnalyzeAsync(html, new Dictionary<string, string>());

        report.CriticalIssues.Should().NotBeEmpty();
        report.Warnings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_flags_localStorage_as_warning_not_critical()
    {
        var html = "<html><body><script>localStorage.setItem('x','1')</script></body></html>";
        var report = await _analyzer.AnalyzeAsync(html, new Dictionary<string, string>());

        report.CriticalIssues.Should().BeEmpty();
        report.Warnings.Should().Contain(w => w.Contains("localStorage", StringComparison.OrdinalIgnoreCase));
    }
}
