namespace DijitalAtolye.Content.API.Domain;

/// <summary>
/// Guard scan-callback status string'leri ve AI moderasyon kapısı için yardımcılar.
/// </summary>
public static class GuardScanStatuses
{
    public const string PendingScan = "pending_scan";
    public const string Scanning = "scanning";
    public const string Clean = "clean";

    private static readonly HashSet<string> Rejected = new(StringComparer.OrdinalIgnoreCase)
    {
        "clamav_infected",
        "eset_infected",
        "policy_rejected",
        "admin_rejected",
        "error",
    };

    /// <summary>Guard reddi — içerik AutoRejected olmalı.</summary>
    public static bool IsRejected(string status) => Rejected.Contains(status);

    /// <summary>
    /// Otomatik tarama geçti; AI moderasyonu başlatılabilir.
    /// Manuel inceleme (<c>manual_review</c>, <c>yara_manual_review</c>) bu kapıdan geçmez.
    /// </summary>
    public static bool IsCleanForAiModeration(string? status) =>
        string.Equals(status, Clean, StringComparison.OrdinalIgnoreCase);

    /// <summary>Guard henüz sonuç vermedi (boş, pending_scan, scanning).</summary>
    public static bool IsGuardPending(string? status) =>
        string.IsNullOrWhiteSpace(status)
        || string.Equals(status, PendingScan, StringComparison.OrdinalIgnoreCase)
        || string.Equals(status, Scanning, StringComparison.OrdinalIgnoreCase);
}
