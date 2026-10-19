using DijitalAtolye.Content.API.AiExtraction;
using DijitalAtolye.Content.API.Endpoints;
using DijitalAtolye.Content.API.Studio;
using FluentAssertions;
using Microsoft.AspNetCore.DataProtection;

namespace Content.Tests;

public sealed class GeneratedHtmlExtractorTests
{
    private const string Doc = "<!DOCTYPE html>\n<html lang=\"tr\"><body><canvas></canvas></body></html>";

    [Fact]
    public void Extracts_fenced_html_and_summary()
    {
        var response = $"İşte oyun:\n```html\n{Doc}\n```\n\n**Değişiklik özeti:**\n- Süre sayacı eklendi";

        var result = GeneratedHtmlExtractor.Extract(response, "stop");

        result.Error.Should().BeNull();
        result.Html.Should().Be(Doc);
        result.Summary.Should().Be("- Süre sayacı eklendi");
    }

    [Fact]
    public void Accepts_uppercase_fence_label()
    {
        GeneratedHtmlExtractor.Extract($"```HTML\n{Doc}\n```").Html.Should().Be(Doc);
    }

    [Fact]
    public void Falls_back_to_raw_document_without_fence()
    {
        var result = GeneratedHtmlExtractor.Extract($"Kod:\n{Doc}\nDeğişiklik özeti: ilk sürüm");

        result.Html.Should().Be(Doc);
        result.Summary.Should().Be("ilk sürüm");
    }

    [Fact]
    public void Unclosed_fence_is_reported_as_truncated()
    {
        var result = GeneratedHtmlExtractor.Extract("```html\n<!DOCTYPE html><html><body>", "length");

        result.Html.Should().BeNull();
        result.Error.Should().Contain("kesildi");
    }

    [Fact]
    public void Document_without_closing_html_tag_is_rejected()
    {
        var result = GeneratedHtmlExtractor.Extract("```html\n<!DOCTYPE html><html><body>\n```");

        result.Html.Should().BeNull();
        result.Error.Should().Contain("kesildi");
    }

    [Fact]
    public void Response_without_code_is_rejected()
    {
        var result = GeneratedHtmlExtractor.Extract("Üzgünüm, bunu yapamam.", "stop");

        result.Html.Should().BeNull();
        result.Error.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void Oversized_html_is_rejected()
    {
        var big = "<!DOCTYPE html><html><body>" + new string('a', GeneratedHtmlExtractor.MaxHtmlBytes) + "</body></html>";

        GeneratedHtmlExtractor.Extract($"```html\n{big}\n```").Error.Should().Contain("1,5 MB");
    }
}

public sealed class GeneratedGameLinterTests
{
    [Fact]
    public void Clean_self_contained_game_passes()
    {
        const string html = """
            <!DOCTYPE html><html lang="tr"><head><style>body{margin:0}</style></head>
            <body><svg viewBox="0 0 10 10"></svg><img src="data:image/png;base64,AAAA">
            <script>
              function daReport(type, score) { window.parent.postMessage({ app: 'dijitalatolye', type: type, score: score }, '*'); }
              requestAnimationFrame(function loop() { requestAnimationFrame(loop); });
            </script></body></html>
            """;

        GeneratedGameLinter.Check(html).Should().BeEmpty();
    }

    [Theory]
    [InlineData("<script>eval('1')</script>")]
    [InlineData("<script>const f = new Function('return 1');</script>")]
    [InlineData("<script>function updateFunction(){}</script>")] // analizör metin bazlı: bunu da yakalar
    [InlineData("<script>document.write('x')</script>")]
    [InlineData("<script>document.cookie = 'a=1'</script>")]
    [InlineData("<script>localStorage.setItem('k', 1)</script>")]
    [InlineData("<script>fetch('/api')</script>")]
    [InlineData("<script src=\"https://cdn.jsdelivr.net/npm/phaser\"></script>")]
    [InlineData("<link rel=\"stylesheet\" href=\"//fonts.googleapis.com/css\">")]
    [InlineData("<style>@import url('https://example.com/a.css');</style>")]
    public void Forbidden_patterns_are_reported(string snippet)
    {
        GeneratedGameLinter.Check($"<!DOCTYPE html><html><body>{snippet}</body></html>").Should().NotBeEmpty();
    }
}

public sealed class ChatStreamAccumulatorTests
{
    [Fact]
    public void Collects_content_usage_and_finish_reason_until_done()
    {
        var acc = new ChatStreamAccumulator();
        string[] lines =
        [
            ": keep-alive",
            "data: {\"choices\":[{\"delta\":{\"role\":\"assistant\",\"reasoning_content\":\"düşünüyorum\"}}]}",
            "",
            "data: {\"choices\":[{\"delta\":{\"content\":\"```html\\n<html>\"}}]}",
            "data: {bozuk json",
            "data: {\"choices\":[{\"delta\":{\"content\":\"</html>\\n```\"},\"finish_reason\":\"stop\"}]}",
            "data: {\"choices\":[],\"usage\":{\"prompt_tokens\":120,\"completion_tokens\":45}}",
        ];

        foreach (var line in lines) acc.Accept(line).Should().BeTrue();
        acc.Accept("data: [DONE]").Should().BeFalse();

        acc.Content.Should().Be("```html\n<html></html>\n```");
        acc.FinishReason.Should().Be("stop");
        acc.PromptTokens.Should().Be(120);
        acc.CompletionTokens.Should().Be(45);
    }
}

public sealed class StudioPolicyTests
{
    [Theory]
    [InlineData("2026-10-19T20:59:59Z", "2026-10-18T21:00:00Z")] // TSİ 23:59 → gün 19 Ekim
    [InlineData("2026-10-19T21:00:00Z", "2026-10-19T21:00:00Z")] // TSİ 00:00 → yeni gün
    [InlineData("2026-10-19T08:00:00Z", "2026-10-18T21:00:00Z")]
    public void Daily_quota_resets_at_midnight_turkey_time(string nowUtc, string expectedStartUtc)
    {
        var now = DateTime.Parse(nowUtc, null, System.Globalization.DateTimeStyles.AdjustToUniversal);
        var expected = DateTime.Parse(expectedStartUtc, null, System.Globalization.DateTimeStyles.AdjustToUniversal);

        StudioEndpoints.StartOfTodayUtc(now).Should().Be(expected);
    }

    [Fact]
    public void Default_model_list_is_used_when_config_is_empty()
    {
        var opts = new StudioOptions();

        opts.IsAllowedModel("deepseek-v4.1-flash").Should().BeTrue();
        opts.IsAllowedModel("deepseek-v4-flash").Should().BeFalse(); // 1 Kasım 2026'da kaldırılıyor
        opts.IsAllowedModel(null).Should().BeFalse();
    }

    [Fact]
    public void Configured_model_list_overrides_defaults()
    {
        var opts = new StudioOptions { AllowedModels = ["glm-5.3"] };

        opts.IsAllowedModel("glm-5.3").Should().BeTrue();
        opts.IsAllowedModel("deepseek-v4.1-flash").Should().BeFalse();
    }

    [Fact]
    public void User_key_round_trips_encrypted_and_exposes_only_last4()
    {
        var protector = new StudioKeyProtector(new EphemeralDataProtectionProvider());
        const string key = "evren_sk_1234567890abcd";

        var encrypted = protector.Protect(key);

        encrypted.Should().NotContain(key);
        protector.Unprotect(encrypted).Should().Be(key);
        StudioKeyProtector.Last4(key).Should().Be("abcd");
    }
}

public sealed class GamePromptBuilderTests
{
    private static readonly GameBrief Brief = new(
        "Kesir Avcısı", "Kesirleri doğru sepete yönlendiren oyun", ["Matematik"], [5],
        [new CatalogOutcomeDto("M.5.1.2.1", "Kesirleri karşılaştırır")]);

    [Fact]
    public void Initial_prompt_contains_brief_without_repeating_idea()
    {
        var messages = GamePromptBuilder.BuildInitial(Brief, Brief.Idea);

        messages.Should().HaveCount(2);
        messages[0].Role.Should().Be("system");
        var user = messages[1].Content;
        user.Should().Contain("M.5.1.2.1: Kesirleri karşılaştırır").And.Contain("5. sınıf");
        user.Should().NotContain("ÖĞRETMENİN OYUN İSTEĞİ");
    }

    [Fact]
    public void Revision_prompt_includes_current_code_and_request()
    {
        var messages = GamePromptBuilder.BuildRevision(Brief, "<html>eski</html>", "Süre sayacı ekle");

        messages[1].Content.Should().Contain("<html>eski</html>").And.Contain("Süre sayacı ekle");
    }

    [Fact]
    public void Fix_prompt_appends_previous_answer_and_violations()
    {
        var initial = GamePromptBuilder.BuildInitial(Brief, Brief.Idea);

        var fix = GamePromptBuilder.BuildFix(initial, "önceki yanıt", ["Yasaklı ifade: 'eval('"]);

        fix.Should().HaveCount(4);
        fix[2].Should().Be(new StudioChatMessage("assistant", "önceki yanıt"));
        fix[3].Content.Should().Contain("eval(");
    }
}
