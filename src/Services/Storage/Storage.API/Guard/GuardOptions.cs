namespace DijitalAtolye.Storage.API.Guard;

public sealed class GuardOptions
{
    /// <summary>Guard service base URL (örn. <c>http://guard-web:8000</c>).</summary>
    public string BaseUrl { get; init; } = "http://localhost:18000";

    /// <summary>
    /// Ana sitenin Guard'a bildirdiği kaynak kimliği. Guard her source için ayrı HMAC secret tutar;
    /// bu değer <c>GUARD_HMAC_SECRETS</c> JSON'ındaki anahtarla aynı olmalıdır
    /// (örn. <c>ana-site-saglikli-yasam</c>).
    /// </summary>
    public string SourceId { get; init; } = string.Empty;

    /// <summary>
    /// Ana siteden Guard'a giden upload isteklerinin HMAC secret'ı
    /// (<c>GUARD_HMAC_SECRETS[SourceId]</c> ile eşleşmeli).
    /// </summary>
    public string Secret { get; init; } = string.Empty;

    /// <summary>
    /// Guard'ın ana siteye yaptığı callback/delivery imzalarını doğrulamak için secret
    /// (<c>GUARD_MAIN_SITE_HMAC_SECRET</c>). Boş ise <see cref="Secret"/> kullanılır.
    /// </summary>
    public string InboundSecret { get; init; } = string.Empty;

    /// <summary>Guard'ın geri çağıracağı ana site base URL'i (Guard tarafında <c>GUARD_MAIN_SITE_BASE</c>).</summary>
    public string CallbackBaseUrl { get; init; } = string.Empty;

    /// <summary>Inbound callback imza doğrulamasında kullanılacak secret.</summary>
    public string EffectiveInboundSecret =>
        string.IsNullOrWhiteSpace(InboundSecret) ? Secret : InboundSecret;

    /// <summary>Outbound multipart upload timeout. Büyük dosyalar (256 MB max) için cömert tutulur.</summary>
    public TimeSpan UploadTimeout { get; init; } = TimeSpan.FromMinutes(5);

    /// <summary>Default 300s, Guard sunucusundaki <c>GUARD_HMAC_TIMESTAMP_SKEW</c> ile eşleşmeli.</summary>
    public int TimestampSkewSeconds { get; init; } = 300;
}
