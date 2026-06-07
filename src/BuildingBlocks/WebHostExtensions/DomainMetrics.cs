using System.Diagnostics.Metrics;

namespace DijitalAtolye.BuildingBlocks.WebHostExtensions;

/// <summary>
/// Servisler arası ortak iş (domain) metrikleri. Meter adı "DijitalAtolye.Domain" olduğundan
/// OpenTelemetry kurulumundaki AddMeter("DijitalAtolye.*") tarafından otomatik yakalanır ve
/// her servisin /metrics (Prometheus) endpoint'inde görünür.
/// </summary>
public static class DomainMetrics
{
    public const string MeterName = "DijitalAtolye.Domain";
    private static readonly Meter Meter = new(MeterName, "1.0.0");

    public static readonly Counter<long> ContentPublished =
        Meter.CreateCounter<long>("dijitalatolye_content_published_total", description: "Yayınlanan içerik sayısı");

    public static readonly Counter<long> ModerationCompleted =
        Meter.CreateCounter<long>("dijitalatolye_moderation_completed_total", description: "Tamamlanan AI moderasyon sayısı");

    public static readonly Histogram<double> ModerationCostUsd =
        Meter.CreateHistogram<double>("dijitalatolye_moderation_cost_usd", unit: "USD", description: "AI moderasyon LLM maliyeti (USD)");

    public static readonly Counter<long> AssignmentAssigned =
        Meter.CreateCounter<long>("dijitalatolye_assignment_assigned_total", description: "Öğrenciye atanan ödev sayısı");

    public static readonly Counter<long> AnalyticsEvent =
        Meter.CreateCounter<long>("dijitalatolye_analytics_event_total", description: "Kaydedilen analytics olay sayısı");
}
