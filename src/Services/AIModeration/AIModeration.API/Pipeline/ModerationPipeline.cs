using System.IO.Compression;
using System.Text;
using System.Text.Json;
using DijitalAtolye.AIModeration.API.Llm;
using DijitalAtolye.AIModeration.API.Persistence;
using DijitalAtolye.AIModeration.API.StaticAnalysis;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Content;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Moderation;
using Minio;
using Minio.DataModel.Args;

namespace DijitalAtolye.AIModeration.API.Pipeline;

/// <summary>
/// Statik analiz + LLM analizi orkestrasyonu. Karar matrisi PRD §6.3 uyarınca uygulanır.
/// </summary>
public sealed class ModerationPipeline
{
    private readonly IMinioClient _minio;
    private readonly IStaticAnalyzer _analyzer;
    private readonly ILlmProvider _llm;
    private readonly IModerationReportStore _store;
    private readonly ILogger<ModerationPipeline> _logger;
    private readonly IConfiguration _config;

    public ModerationPipeline(
        IMinioClient minio,
        IStaticAnalyzer analyzer,
        ILlmProvider llm,
        IModerationReportStore store,
        ILogger<ModerationPipeline> logger,
        IConfiguration config)
    {
        _minio = minio;
        _analyzer = analyzer;
        _llm = llm;
        _store = store;
        _logger = logger;
        _config = config;
    }

    public async Task<(AIModerationCompletedV1 Event, ModerationReport Report)> AnalyzeAsync(ContentSubmittedV1 submitted, CancellationToken ct)
    {
        // 1) ZIP'i indir
        var bucket = _config["Storage:ContentBucket"] ?? "dijitalatolye-content";
        var zipBytes = await DownloadObjectAsync(bucket, submitted.StorageKey, ct);

        // 2) Manifest entry HTML + JS dosyalarını çıkar
        var (entryHtml, jsFiles) = ExtractEntry(zipBytes, submitted.ManifestEntry);

        // 3) Statik analiz
        var staticReport = await _analyzer.AnalyzeAsync(entryHtml, jsFiles, ct);

        // 4) LLM analiz (Türkçe pedagojik + güvenlik)
        var systemPrompt = BuildSystemPrompt();
        var userPrompt = BuildUserPrompt(submitted, staticReport, entryHtml, jsFiles);
        LlmResponse llmResponse;
        try
        {
            llmResponse = await _llm.CompleteJsonAsync(systemPrompt, userPrompt, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LLM call failed; AutoReject olarak işaretlenecek");
            llmResponse = new LlmResponse("{\"score\":30,\"summary\":\"LLM error\",\"flags\":[]}", 0, 0, 0m);
        }

        // 5) Karar matrisi
        var (score, summary) = ParseLlmJson(llmResponse.RawJson);
        var decision = ModerationDecisionRules.Decide(score, staticReport.CriticalIssues.Count);

        var report = new ModerationReport
        {
            ContentId = submitted.ContentId,
            VersionId = submitted.VersionId,
            ProviderName = _llm.Name,
            ProviderModel = _llm.Model,
            Score = score,
            Decision = decision,
            CriticalFlags = [.. staticReport.CriticalIssues],
            Warnings = [.. staticReport.Warnings],
            ExternalUrls = [.. staticReport.ExternalUrls],
            SuggestedCsp = staticReport.SuggestedCsp,
            LlmRawJson = llmResponse.RawJson,
            PromptTokens = llmResponse.PromptTokens,
            CompletionTokens = llmResponse.CompletionTokens,
            EstimatedCostUsd = llmResponse.EstimatedCostUsd,
        };
        await _store.SaveAsync(report, ct);

        var evt = new AIModerationCompletedV1
        {
            ContentId = submitted.ContentId,
            VersionId = submitted.VersionId,
            ReportId = report.Id,
            Decision = decision,
            Score = score,
            CriticalFlags = report.CriticalFlags.AsReadOnly(),
            Warnings = report.Warnings.AsReadOnly(),
            ProviderName = report.ProviderName,
            ProviderModel = report.ProviderModel,
        };

        _logger.LogInformation("Moderation done: content={Content} score={Score} decision={Decision} cost=${Cost}",
            submitted.ContentId, score, decision, report.EstimatedCostUsd);

        _ = summary;
        return (evt, report);
    }

    private async Task<byte[]> DownloadObjectAsync(string bucket, string key, CancellationToken ct)
    {
        using var ms = new MemoryStream();
        await _minio.GetObjectAsync(new GetObjectArgs()
            .WithBucket(bucket)
            .WithObject(key)
            .WithCallbackStream(s => s.CopyTo(ms)), ct);
        return ms.ToArray();
    }

    private static (string EntryHtml, IReadOnlyDictionary<string, string> JsFiles) ExtractEntry(byte[] zipBytes, string entryName)
    {
        // Tek HTML upload fallback: ZIP imzası ("PK\x03\x04") yoksa içeriği doğrudan HTML kabul et.
        if (zipBytes.Length < 4 || !(zipBytes[0] == 0x50 && zipBytes[1] == 0x4B && zipBytes[2] == 0x03 && zipBytes[3] == 0x04))
        {
            return (Encoding.UTF8.GetString(zipBytes), new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase));
        }
        using var ms = new MemoryStream(zipBytes);
        using var zip = new ZipArchive(ms, ZipArchiveMode.Read);
        var entryHtml = string.Empty;
        var entry = zip.GetEntry(entryName)
            ?? zip.Entries.FirstOrDefault(e => e.FullName.EndsWith(entryName, StringComparison.OrdinalIgnoreCase));
        if (entry is not null)
        {
            using var sr = new StreamReader(entry.Open(), Encoding.UTF8);
            entryHtml = sr.ReadToEnd();
        }

        var jsFiles = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var e in zip.Entries.Where(e => e.FullName.EndsWith(".js", StringComparison.OrdinalIgnoreCase)))
        {
            using var sr = new StreamReader(e.Open(), Encoding.UTF8);
            jsFiles[e.FullName] = sr.ReadToEnd();
        }
        return (entryHtml, jsFiles);
    }

    private string BuildSystemPrompt()
    {
        var version = _config["AIModeration:PromptVersion"] ?? PromptTemplates.SystemPromptVersion;
        return version switch
        {
            "v2" => PromptTemplates.SystemPromptV2,
            _ => PromptTemplates.CompactSystemPromptV1,
        };
    }

    private static string BuildUserPrompt(ContentSubmittedV1 s, StaticAnalysisReport sr, string entryHtml, IReadOnlyDictionary<string, string> jsFiles)
    {
        var sb = new StringBuilder();
        sb.Append("İçerik başlık: ").AppendLine(s.Title);
        sb.Append("Sınıf seviyesi: ").AppendLine(s.GradeLevel?.ToString() ?? "?");
        sb.Append("Ders: ").AppendLine(s.Subject);
        sb.Append("Hedeflenen kazanımlar: ").AppendLine(string.Join(", ", s.OutcomeCodes));
        sb.AppendLine();
        sb.AppendLine("Statik analiz raporu:");
        sb.Append("- Kritik bulgular: ").AppendLine(string.Join(" | ", sr.CriticalIssues));
        sb.Append("- Uyarılar: ").AppendLine(string.Join(" | ", sr.Warnings));
        sb.Append("- Dış kaynaklar: ").AppendLine(string.Join(" | ", sr.ExternalUrls));
        sb.AppendLine();
        sb.AppendLine("Entry HTML (ilk 4000 karakter):");
        sb.AppendLine(entryHtml.Length > 4000 ? entryHtml[..4000] : entryHtml);
        sb.AppendLine();
        
        if (jsFiles.Any())
        {
            sb.AppendLine("Örnek JS Kodları (ilk 2 dosya, her biri max 2000 karakter):");
            foreach (var js in jsFiles.Take(2))
            {
                sb.AppendLine($"--- {js.Key} ---");
                sb.AppendLine(js.Value.Length > 2000 ? js.Value[..2000] : js.Value);
            }
        }

        return sb.ToString();
    }

    private static (int Score, string Summary) ParseLlmJson(string rawJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(rawJson);
            var score = doc.RootElement.TryGetProperty("score", out var s) ? s.GetInt32() : 50;
            var summary = doc.RootElement.TryGetProperty("summary", out var sm) ? sm.GetString() ?? string.Empty : string.Empty;
            return (Math.Clamp(score, 0, 100), summary);
        }
        catch
        {
            return (40, "Geçersiz LLM yanıtı");
        }
    }

}
