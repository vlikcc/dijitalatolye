using System.IO.Compression;
using System.Text;
using HtmlAgilityPack;

namespace DijitalAtolye.Content.API.AiExtraction;

/// <summary>
/// Yüklenen ZIP/HTML bundle'ından LLM'e gönderilecek metin örneği çıkarır.
/// Title + headings (h1-h3) + body text, ~8K karakter ile sınırlı.
/// </summary>
public sealed class BundleTextSampler
{
    public const int DefaultMaxChars = 8_000;
    private const int MaxHtmlFilesToScan = 8;
    private static readonly string[] HtmlExtensions = [".html", ".htm"];

    public BundleSample Sample(Stream input, string fileName, int maxChars = DefaultMaxChars)
    {
        ArgumentNullException.ThrowIfNull(input);
        var ext = Path.GetExtension(fileName).ToLowerInvariant();

        var sb = new StringBuilder(maxChars);
        var titles = new List<string>();
        var headings = new List<string>();
        var filesScanned = 0;

        if (ext is ".html" or ".htm")
        {
            using var ms = ReadAll(input);
            AppendHtmlSample(ms.ToArray(), sb, titles, headings, maxChars);
            filesScanned = 1;
        }
        else if (ext == ".zip")
        {
            using var zip = new ZipArchive(input, ZipArchiveMode.Read, leaveOpen: true);
            // manifest.json önce, sonra entry.html benzeri kök HTML, sonra alfabetik diğer HTML'ler
            var manifestTitle = TryReadManifestTitle(zip);
            if (!string.IsNullOrWhiteSpace(manifestTitle)) titles.Add(manifestTitle!);

            var htmlEntries = zip.Entries
                .Where(e => !string.IsNullOrEmpty(e.Name))
                .Where(e => !e.FullName.Contains("..", StringComparison.Ordinal))
                .Where(e => HtmlExtensions.Contains(Path.GetExtension(e.Name).ToLowerInvariant()))
                .OrderBy(e => e.FullName.Count(c => c == '/'))   // önce kök seviyesi
                .ThenBy(e => e.FullName, StringComparer.OrdinalIgnoreCase)
                .Take(MaxHtmlFilesToScan)
                .ToList();

            foreach (var entry in htmlEntries)
            {
                if (sb.Length >= maxChars) break;
                using var es = entry.Open();
                using var ms = new MemoryStream();
                es.CopyTo(ms);
                AppendHtmlSample(ms.ToArray(), sb, titles, headings, maxChars);
                filesScanned++;
            }
        }
        else
        {
            throw new InvalidOperationException($"Desteklenmeyen bundle uzantısı: {ext}");
        }

        var text = sb.ToString();
        if (text.Length > maxChars) text = text[..maxChars];

        return new BundleSample(
            Text: text,
            Titles: titles.Distinct(StringComparer.OrdinalIgnoreCase).Take(5).ToList(),
            Headings: headings.Distinct(StringComparer.OrdinalIgnoreCase).Take(20).ToList(),
            FilesScanned: filesScanned);
    }

    private static MemoryStream ReadAll(Stream input)
    {
        var ms = new MemoryStream();
        input.CopyTo(ms);
        ms.Position = 0;
        return ms;
    }

    private static void AppendHtmlSample(byte[] bytes, StringBuilder sb, List<string> titles, List<string> headings, int maxChars)
    {
        var html = TryDecode(bytes);
        var doc = new HtmlDocument { OptionEmptyCollection = true };
        try { doc.LoadHtml(html); }
        catch { return; }

        var titleNode = doc.DocumentNode.SelectSingleNode("//title");
        if (titleNode is not null)
        {
            var t = Clean(titleNode.InnerText);
            if (!string.IsNullOrWhiteSpace(t)) titles.Add(t);
        }

        var headingNodes = doc.DocumentNode.SelectNodes("//h1|//h2|//h3");
        if (headingNodes is not null)
        {
            foreach (var h in headingNodes)
            {
                var t = Clean(h.InnerText);
                if (!string.IsNullOrWhiteSpace(t)) headings.Add(t);
            }
        }

        // script + style temizle
        foreach (var n in (doc.DocumentNode.SelectNodes("//script|//style|//noscript") ?? Enumerable.Empty<HtmlNode>()).ToList())
        {
            n.Remove();
        }

        var body = doc.DocumentNode.SelectSingleNode("//body") ?? doc.DocumentNode;
        var bodyText = Clean(body.InnerText);
        if (string.IsNullOrWhiteSpace(bodyText)) return;

        var remaining = maxChars - sb.Length;
        if (remaining <= 0) return;
        if (bodyText.Length > remaining) bodyText = bodyText[..remaining];

        if (sb.Length > 0) sb.Append("\n\n---\n\n");
        sb.Append(bodyText);
    }

    private static string? TryReadManifestTitle(ZipArchive zip)
    {
        var manifest = zip.Entries.FirstOrDefault(e =>
            string.Equals(e.Name, "manifest.json", StringComparison.OrdinalIgnoreCase));
        if (manifest is null) return null;
        try
        {
            using var sr = new StreamReader(manifest.Open());
            var json = sr.ReadToEnd();
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("title", out var t) && t.ValueKind == System.Text.Json.JsonValueKind.String)
            {
                return t.GetString();
            }
        }
        catch { /* sessiz */ }
        return null;
    }

    private static string TryDecode(byte[] bytes)
    {
        try { return Encoding.UTF8.GetString(bytes); }
        catch { return Encoding.GetEncoding("ISO-8859-9").GetString(bytes); }
    }

    private static string Clean(string raw)
    {
        if (string.IsNullOrEmpty(raw)) return string.Empty;
        var decoded = HtmlEntity.DeEntitize(raw);
        // whitespace normalize
        var sb = new StringBuilder(decoded.Length);
        var lastSpace = false;
        foreach (var c in decoded)
        {
            if (char.IsWhiteSpace(c))
            {
                if (!lastSpace) { sb.Append(' '); lastSpace = true; }
            }
            else { sb.Append(c); lastSpace = false; }
        }
        return sb.ToString().Trim();
    }
}

public sealed record BundleSample(
    string Text,
    IReadOnlyList<string> Titles,
    IReadOnlyList<string> Headings,
    int FilesScanned);
