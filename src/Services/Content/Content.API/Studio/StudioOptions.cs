namespace DijitalAtolye.Content.API.Studio;

/// <summary>
/// AI Oyun Stüdyosu — EVREN LLM (OpenAI uyumlu) ayarları. BaseUrl yalnızca sunucu konfigürasyonundan gelir;
/// kullanıcı kendi anahtarını getirse bile istek her zaman bu uç noktaya gider (SSRF önlemi).
/// </summary>
public sealed class StudioOptions
{
    public const string SectionName = "AiStudio:Evren";

    /// <summary>Konfigürasyonda liste verilmezse kullanılan, kod üretimine uygun modeller.</summary>
    public static readonly string[] DefaultAllowedModels =
    [
        "qwen3.8-flash-next", "glm-5.3", "deepseek-v4.1-flash", "mimo-v2.6-pro", "auto",
    ];

    public string BaseUrl { get; set; } = "https://evren-llmapi.ssyz.org.tr/v1";

    /// <summary>Platform (paylaşılan) anahtarı. Boşsa yalnızca kendi anahtarı olan öğretmenler üretebilir.</summary>
    public string PlatformApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Ekim 2026 ölçümü: qwen3.8-flash-next ~190 karakter/sn, glm-5.3 ~95, deepseek-v4.1-flash yük altında ~10.
    /// Tam bir oyun ~20-40 bin karakter olduğundan hızlı model varsayılandır.
    /// </summary>
    public string DefaultModel { get; set; } = "qwen3.8-flash-next";

    public string[] AllowedModels { get; set; } = [];

    /// <summary>Filodaki çoğu modelin çıktı tavanı 16K token.</summary>
    public int MaxOutputTokens { get; set; } = 16000;

    public double Temperature { get; set; } = 0.4;

    public int TimeoutSeconds { get; set; } = 900;

    /// <summary>Platform anahtarıyla kullanıcı başına günlük üretim (tur) sınırı. Kendi anahtarına uygulanmaz.</summary>
    public int DailyGenerationsPerUser { get; set; } = 20;

    /// <summary>Aynı anda EVREN'e giden üretim isteği tavanı (EVREN anahtar başına 32 eşzamanlı istek tanır).</summary>
    public int MaxConcurrent { get; set; } = 8;

    /// <summary>
    /// Düşünme (reasoning) modunu kapatır (vLLM <c>chat_template_kwargs</c>). Açıkken modeller koda başlamadan
    /// dakikalarca düşünme metni üretip zaman aşımına düşebiliyor.
    /// </summary>
    public bool DisableThinking { get; set; } = true;

    public bool PlatformKeyConfigured => !string.IsNullOrWhiteSpace(PlatformApiKey);

    public IReadOnlyList<string> EffectiveAllowedModels =>
        AllowedModels.Length > 0 ? AllowedModels : DefaultAllowedModels;

    public bool IsAllowedModel(string? model) =>
        !string.IsNullOrWhiteSpace(model) && EffectiveAllowedModels.Contains(model, StringComparer.Ordinal);
}
