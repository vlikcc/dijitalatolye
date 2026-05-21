using System.IO.Compression;
using System.Text;
using DijitalAtolye.Content.API.AiExtraction;
using FluentAssertions;
using Xunit;

namespace DijitalAtolye.Content.API.AiExtraction.Tests;

public sealed class BundleTextSamplerTests
{
    private readonly BundleTextSampler _sampler = new();

    [Fact]
    public void Sample_SingleHtml_ExtractsTitleHeadingsAndBody()
    {
        var html = """
            <!doctype html>
            <html><head><title>Doğal Sayılar Etkinliği</title></head>
            <body>
              <h1>5. Sınıf Matematik</h1>
              <h2>Basamak Değeri</h2>
              <script>alert('x')</script>
              <p>Bu etkinlikte öğrenciler basamak değerini örnekler üzerinden keşfeder.</p>
            </body></html>
            """;
        using var ms = new MemoryStream(Encoding.UTF8.GetBytes(html));

        var sample = _sampler.Sample(ms, "index.html");

        sample.Titles.Should().Contain(s => s.Contains("Doğal Sayılar", StringComparison.Ordinal));
        sample.Headings.Should().Contain(s => s.Contains("5. Sınıf", StringComparison.Ordinal));
        sample.Headings.Should().Contain(s => s.Contains("Basamak", StringComparison.Ordinal));
        sample.Text.Should().Contain("basamak değerini");
        sample.Text.Should().NotContain("alert");
        sample.FilesScanned.Should().Be(1);
    }

    [Fact]
    public void Sample_Zip_ReadsManifestTitleAndMultipleHtmlFiles()
    {
        using var zipMs = new MemoryStream();
        using (var zip = new ZipArchive(zipMs, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddEntry(zip, "manifest.json", """{"entry":"index.html","title":"Kesirler Oyunu","version":"1.0"}""");
            AddEntry(zip, "index.html", "<html><head><title>Kesirler</title></head><body><h1>Kesirler Oyunu</h1><p>Pizza dilimleri ile kesirleri öğren.</p></body></html>");
            AddEntry(zip, "page2.html", "<html><body><h2>Eşit Kesirler</h2><p>Pay ve payda kavramı.</p></body></html>");
        }
        zipMs.Position = 0;

        var sample = _sampler.Sample(zipMs, "bundle.zip");

        sample.Titles.Should().Contain("Kesirler Oyunu");
        sample.Headings.Should().Contain(s => s.Contains("Eşit Kesirler", StringComparison.Ordinal));
        sample.Text.Should().Contain("Pizza dilimleri");
        sample.Text.Should().Contain("Pay ve payda");
        sample.FilesScanned.Should().BeGreaterThanOrEqualTo(2);
    }

    [Fact]
    public void Sample_RespectsMaxCharLimit()
    {
        var big = string.Join(" ", Enumerable.Range(0, 5000).Select(i => "kelime" + i));
        var html = $"<html><body><p>{big}</p></body></html>";
        using var ms = new MemoryStream(Encoding.UTF8.GetBytes(html));

        var sample = _sampler.Sample(ms, "x.html", maxChars: 1000);

        sample.Text.Length.Should().BeLessThanOrEqualTo(1000);
    }

    [Fact]
    public void Sample_ZipWithSuspiciousPath_IsIgnored()
    {
        using var zipMs = new MemoryStream();
        using (var zip = new ZipArchive(zipMs, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddEntry(zip, "../evil.html", "<html><body><h1>evil</h1></body></html>");
            AddEntry(zip, "index.html", "<html><body><p>iyi içerik</p></body></html>");
        }
        zipMs.Position = 0;

        var sample = _sampler.Sample(zipMs, "bundle.zip");

        sample.Text.Should().Contain("iyi içerik");
        sample.Headings.Should().NotContain(s => s.Contains("evil", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Sample_UnknownExtension_Throws()
    {
        using var ms = new MemoryStream(new byte[] { 1, 2, 3 });
        Action act = () => _sampler.Sample(ms, "bundle.pdf");
        act.Should().Throw<InvalidOperationException>();
    }

    private static void AddEntry(ZipArchive zip, string name, string content)
    {
        var entry = zip.CreateEntry(name);
        using var s = entry.Open();
        using var w = new StreamWriter(s, Encoding.UTF8);
        w.Write(content);
    }
}
