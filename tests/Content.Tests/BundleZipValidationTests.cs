using System.IO.Compression;
using System.Reflection;
using System.Text;
using System.Text.Json;
using DijitalAtolye.Content.API.Bundles;
using FluentAssertions;

namespace DijitalAtolye.Content.Tests;

public sealed class BundleZipValidationTests
{
    [Fact]
    public void ValidateZip_accepts_valid_manifest_and_entry()
    {
        using var ms = CreateValidZip();
        var result = InvokeValidateZip(ms, declaredEntry: "index.html", sha: "abc", size: ms.Length);

        result.ManifestEntry.Should().Be("index.html");
        result.ManifestTitle.Should().Be("Test Title");
        result.FileCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public void ValidateZip_rejects_zip_without_manifest()
    {
        using var ms = new MemoryStream();
        using (var archive = new ZipArchive(ms, ZipArchiveMode.Create, true))
        {
            var entry = archive.CreateEntry("index.html");
            using var w = entry.Open();
            w.Write(Encoding.UTF8.GetBytes("<html></html>"));
        }
        ms.Position = 0;

        Action act = () => InvokeValidateZip(ms, null, "abc", ms.Length);
        act.Should().Throw<TargetInvocationException>()
            .WithInnerException<BundleValidationException>()
            .WithMessage("*manifest.json*");
    }

    private static MemoryStream CreateValidZip()
    {
        var ms = new MemoryStream();
        using (var archive = new ZipArchive(ms, ZipArchiveMode.Create, true))
        {
            var manifest = archive.CreateEntry("manifest.json");
            using (var w = manifest.Open())
            {
                var json = JsonSerializer.Serialize(new
                {
                    entry = "index.html",
                    title = "Test Title",
                    version = "1.0.0",
                });
                w.Write(Encoding.UTF8.GetBytes(json));
            }
            var html = archive.CreateEntry("index.html");
            using (var w = html.Open())
            {
                w.Write(Encoding.UTF8.GetBytes("<html><body>ok</body></html>"));
            }
        }
        ms.Position = 0;
        return ms;
    }

    private static BundleValidationResult InvokeValidateZip(Stream zip, string? declaredEntry, string sha, long size)
    {
        var method = typeof(BundleValidator).GetMethod("ValidateZip", BindingFlags.NonPublic | BindingFlags.Static)
            ?? throw new InvalidOperationException("ValidateZip not found");
        return (BundleValidationResult)method.Invoke(null, [zip, declaredEntry, sha, size])!;
    }
}
