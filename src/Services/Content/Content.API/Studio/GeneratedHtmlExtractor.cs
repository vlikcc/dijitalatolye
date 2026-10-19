using System.Text.RegularExpressions;

namespace DijitalAtolye.Content.API.Studio;

public sealed record ExtractedGame(string? Html, string? Summary, string? Error);

/// <summary>
/// LLM yanıtından oyun HTML'ini ve değişiklik özetini ayıklar. Beklenen biçim: tek ```html bloğu + "Değişiklik özeti:".
/// Kod bloğu yoksa yanıtın kendisinde tam bir HTML belgesi aranır.
/// </summary>
public static partial class GeneratedHtmlExtractor
{
    public const int MaxHtmlBytes = 1_500_000;
    private const int MaxSummaryLength = 2000;

    [GeneratedRegex(@"```[ \t]*html[^\n]*\n(?<code>.*?)\n?```", RegexOptions.Singleline | RegexOptions.IgnoreCase)]
    private static partial Regex HtmlFence();

    [GeneratedRegex(@"```[ \t]*html[^\n]*\n", RegexOptions.IgnoreCase)]
    private static partial Regex HtmlFenceOpen();

    [GeneratedRegex(@"(?<code><!DOCTYPE\s+html.*?</html\s*>)", RegexOptions.Singleline | RegexOptions.IgnoreCase)]
    private static partial Regex RawDocument();

    [GeneratedRegex(@"^\s*(#+\s*)?\**\s*Değişiklik özeti\s*:?\s*\**\s*:?\s*", RegexOptions.IgnoreCase)]
    private static partial Regex SummaryHeading();

    public static ExtractedGame Extract(string? response, string? finishReason = null)
    {
        if (string.IsNullOrWhiteSpace(response))
            return new ExtractedGame(null, null, "Model boş yanıt döndürdü.");

        string? html = null;
        var summaryStart = -1;

        var fence = HtmlFence().Match(response);
        if (fence.Success)
        {
            html = fence.Groups["code"].Value;
            summaryStart = fence.Index + fence.Length;
        }
        else if (HtmlFenceOpen().IsMatch(response))
        {
            // Açılan ama kapanmayan blok: yanıt token sınırında kesildi.
            return new ExtractedGame(null, null, TruncatedMessage);
        }
        else
        {
            var raw = RawDocument().Match(response);
            if (raw.Success)
            {
                html = raw.Groups["code"].Value;
                summaryStart = raw.Index + raw.Length;
            }
        }

        if (html is null)
        {
            return new ExtractedGame(null, null, finishReason == "length"
                ? TruncatedMessage
                : "Model yanıtında oyun kodu bulunamadı. İsteği netleştirip tekrar deneyin.");
        }

        html = html.Trim();
        if (!html.StartsWith("<!DOCTYPE", StringComparison.OrdinalIgnoreCase)
            && !html.StartsWith("<html", StringComparison.OrdinalIgnoreCase))
        {
            return new ExtractedGame(null, null, "Üretilen kod geçerli bir HTML belgesi değil.");
        }
        if (html.IndexOf("</html", StringComparison.OrdinalIgnoreCase) < 0)
        {
            return new ExtractedGame(null, null, TruncatedMessage);
        }
        if (System.Text.Encoding.UTF8.GetByteCount(html) > MaxHtmlBytes)
        {
            return new ExtractedGame(null, null, "Üretilen oyun 1,5 MB sınırını aşıyor.");
        }

        return new ExtractedGame(html, ExtractSummary(response, summaryStart), null);
    }

    private const string TruncatedMessage =
        "Yanıt modelin çıktı sınırında kesildi. Daha sade bir oyun isteyin veya daha uzun çıktı veren bir model seçin.";

    private static string? ExtractSummary(string response, int start)
    {
        if (start < 0 || start >= response.Length) return null;
        var text = SummaryHeading().Replace(response[start..].Trim(), string.Empty).Trim();
        if (text.Length == 0) return null;
        return text.Length <= MaxSummaryLength ? text : text[..MaxSummaryLength];
    }
}
