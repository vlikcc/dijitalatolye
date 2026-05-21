using System.Diagnostics.Metrics;

namespace DijitalAtolye.Content.API.AiExtraction;

/// <summary>
/// `POST /contents/ai-extract` endpoint'i için OpenTelemetry meter'ı.
/// HostBuilderExtensions içinde `DijitalAtolye.*` wildcard'ı ile pickup edilir.
/// Grafana / Prometheus dashboard'unda:
///   - latency_ms p50/p95/p99 (Histogram)
///   - request_total (Counter, status=success|client_error|server_error)
///   - confidence avg (Histogram, sadece success)
///   - candidate_outcomes avg (Histogram, sadece success)
/// </summary>
public sealed class AiExtractionMetrics : IDisposable
{
    public const string MeterName = "DijitalAtolye.Content.AiExtraction";

    private readonly Meter _meter;
    private readonly Histogram<double> _latencyMs;
    private readonly Counter<long> _requestTotal;
    private readonly Histogram<double> _confidence;
    private readonly Histogram<int> _candidateOutcomes;

    public AiExtractionMetrics()
    {
        _meter = new Meter(MeterName, "1.0.0");
        _latencyMs = _meter.CreateHistogram<double>(
            name: "ai_extract.latency",
            unit: "ms",
            description: "POST /contents/ai-extract end-to-end süresi (upload + sample + 2x LLM).");
        _requestTotal = _meter.CreateCounter<long>(
            name: "ai_extract.requests",
            description: "İstek sayısı (status etiketiyle).");
        _confidence = _meter.CreateHistogram<double>(
            name: "ai_extract.confidence",
            unit: "score",
            description: "AI draft phase'in döndüğü confidence (0-1).");
        _candidateOutcomes = _meter.CreateHistogram<int>(
            name: "ai_extract.candidate_outcomes",
            unit: "count",
            description: "Catalog'tan LLM'e gönderilen kazanım adayı sayısı.");
    }

    public void RecordSuccess(double latencyMs, double confidence, int candidateOutcomes)
    {
        _latencyMs.Record(latencyMs, new KeyValuePair<string, object?>("status", "success"));
        _requestTotal.Add(1, new KeyValuePair<string, object?>("status", "success"));
        _confidence.Record(confidence);
        _candidateOutcomes.Record(candidateOutcomes);
    }

    public void RecordClientError(double latencyMs, string reason)
    {
        _latencyMs.Record(latencyMs, new KeyValuePair<string, object?>("status", "client_error"));
        _requestTotal.Add(1,
            new KeyValuePair<string, object?>("status", "client_error"),
            new KeyValuePair<string, object?>("reason", reason));
    }

    public void RecordServerError(double latencyMs, string reason)
    {
        _latencyMs.Record(latencyMs, new KeyValuePair<string, object?>("status", "server_error"));
        _requestTotal.Add(1,
            new KeyValuePair<string, object?>("status", "server_error"),
            new KeyValuePair<string, object?>("reason", reason));
    }

    public void Dispose() => _meter.Dispose();
}
