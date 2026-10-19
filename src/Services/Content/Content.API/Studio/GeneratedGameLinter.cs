using System.Text.RegularExpressions;

namespace DijitalAtolye.Content.API.Studio;

/// <summary>
/// Üretilen oyunun gönderilmeden önce yerel taraması. Kritik desenler AIModeration'daki
/// HtmlJsStaticAnalyzer ile aynıdır (orada otomatik red sebebi); ek olarak sandbox + CDN CSP altında
/// zaten çalışmayacak dış kaynak, ağ ve depolama kullanımı da engellenir.
/// </summary>
public static partial class GeneratedGameLinter
{
    /// <summary>AIModeration HtmlJsStaticAnalyzer.CriticalJsPatterns ile aynı tutulmalı (ordinal, metin bazlı).</summary>
    private static readonly string[] CriticalPatterns =
    [
        "eval(", "Function(", "document.write", "document.cookie",
        "window.opener", "navigator.geolocation",
    ];

    /// <summary>CSP (connect-src 'none') ve sandbox (allow-same-origin yok) altında çalışmayan API'ler.</summary>
    private static readonly string[] UnsupportedPatterns =
    [
        "fetch(", "XMLHttpRequest", "WebSocket(", "navigator.sendBeacon",
        "localStorage", "sessionStorage", "indexedDB",
    ];

    [GeneratedRegex(@"<(script|link|img|iframe|audio|video|source)\b[^>]*\b(src|href)\s*=\s*[""']?\s*(https?:)?//", RegexOptions.IgnoreCase)]
    private static partial Regex ExternalResource();

    [GeneratedRegex(@"@import\s+(url\()?\s*[""']?\s*(https?:)?//", RegexOptions.IgnoreCase)]
    private static partial Regex CssImport();

    public static IReadOnlyList<string> Check(string html)
    {
        var violations = new List<string>();
        foreach (var p in CriticalPatterns)
        {
            if (html.Contains(p, StringComparison.Ordinal))
                violations.Add($"Yasaklı ifade: '{p}'");
        }
        foreach (var p in UnsupportedPatterns)
        {
            if (html.Contains(p, StringComparison.Ordinal))
                violations.Add($"Desteklenmeyen API (ağ/depolama): '{p}'");
        }
        if (ExternalResource().IsMatch(html) || CssImport().IsMatch(html))
            violations.Add("Dış kaynak (CDN/harici URL) kullanımı");
        return violations;
    }
}
