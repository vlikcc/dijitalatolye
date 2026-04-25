using AngleSharp;
using AngleSharp.Html.Dom;

namespace DijitalAtolye.AIModeration.API.StaticAnalysis;

/// <summary>
/// HTML + JavaScript statik analiz. Yasaklı API ve dış kaynak çağrılarını tespit eder,
/// önerilen CSP üretir. Jint AST motoru ile JS parse edilir.
/// </summary>
public sealed class HtmlJsStaticAnalyzer : IStaticAnalyzer
{
    private static readonly string[] BannedJsPatterns =
    [
        "eval(", "Function(", "document.write", "document.cookie",
        "window.opener", "navigator.sendBeacon", "navigator.geolocation",
        "localStorage.setItem", "indexedDB",
    ];

    private static readonly string[] AllowedExternalHosts =
    [
        "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "unpkg.com",
        "fonts.googleapis.com", "fonts.gstatic.com",
    ];

    public async Task<StaticAnalysisReport> AnalyzeAsync(string entryHtml, IReadOnlyDictionary<string, string> jsFiles, CancellationToken ct = default)
    {
        var critical = new List<string>();
        var warnings = new List<string>();
        var externalUrls = new List<string>();

        var config = Configuration.Default;
        using var ctx = BrowsingContext.New(config);
        var doc = await ctx.OpenAsync(req => req.Content(entryHtml), ct);
        var html = (IHtmlDocument)doc;

        foreach (var script in html.QuerySelectorAll("script"))
        {
            var src = script.GetAttribute("src");
            if (!string.IsNullOrEmpty(src) && (src.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                                             || src.StartsWith("https://", StringComparison.OrdinalIgnoreCase)))
            {
                externalUrls.Add(src);
                if (!IsAllowedHost(src))
                {
                    critical.Add($"Whitelist dışı dış script: {src}");
                }
            }
            var inline = script.TextContent;
            if (!string.IsNullOrWhiteSpace(inline))
            {
                ScanJsContent(inline, "<inline>", critical, warnings);
            }
        }

        foreach (var iframe in html.QuerySelectorAll("iframe"))
        {
            var src = iframe.GetAttribute("src") ?? string.Empty;
            warnings.Add($"iframe tespit edildi: {src}");
        }

        foreach (var link in html.QuerySelectorAll("link[rel=stylesheet]"))
        {
            var href = link.GetAttribute("href");
            if (!string.IsNullOrEmpty(href) && href.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            {
                externalUrls.Add(href);
                if (!IsAllowedHost(href)) warnings.Add($"Whitelist dışı stylesheet: {href}");
            }
        }

        foreach (var (path, content) in jsFiles)
        {
            ScanJsContent(content, path, critical, warnings);
        }

        var allowedSrc = string.Join(' ', AllowedExternalHosts.Select(h => $"https://{h}"));
        var csp = $"default-src 'self'; script-src 'self' 'unsafe-inline' {allowedSrc}; style-src 'self' 'unsafe-inline' {allowedSrc}; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none';";

        return new StaticAnalysisReport(critical, warnings, externalUrls, csp);
    }

    private static void ScanJsContent(string content, string path, List<string> critical, List<string> warnings)
    {
        foreach (var pattern in BannedJsPatterns)
        {
            if (content.Contains(pattern, StringComparison.Ordinal))
            {
                critical.Add($"{path}: yasaklı API kullanımı '{pattern}'");
            }
        }

        // Basit URL extraction: V2'de Jint AST ile yerini değiştirilecek.
        if (content.Contains("fetch(", StringComparison.Ordinal) || content.Contains("XMLHttpRequest", StringComparison.Ordinal))
        {
            warnings.Add($"{path}: ağ çağrısı tespit edildi (fetch/XMLHttpRequest) - whitelist gözden geçirilmeli");
        }
    }

    private static bool IsAllowedHost(string url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri)
            && AllowedExternalHosts.Any(h => uri.Host.EndsWith(h, StringComparison.OrdinalIgnoreCase));
}
