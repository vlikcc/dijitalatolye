import type { TechnicalReport as Report } from "@/modules/review-types";
import { StatusBadge } from "./status-badge";
const groups = {
  malware: "Zararlı içerik",
  package: "Paket yapısı",
  resources: "Dosya ve kaynak bağlantıları",
  code: "Kod politikası",
  accessibility: "Statik erişilebilirlik",
  coverage: "İnceleme kapsamı",
};
export function TechnicalReport({ report }: { report: Report }) {
  return (
    <section
      className="report technical-report"
      aria-labelledby="technical-heading"
    >
      <h2 id="technical-heading">Otomatik teknik kontroller</h2>
      <p>
        {report.status === "complete"
          ? "Zorunlu teknik kontroller tamamlandı."
          : report.status === "blocked"
            ? "Pakette ilerlemeyi engelleyen bir bulgu var."
            : "Teknik kontroller tamamlanamadı."}
      </p>
      <p className="form-help">
        Kural sürümü {report.rulesVersion} · {report.filesChecked.length} dosya
        kontrol edildi. Bu sonuç mutlak güvenlik veya erişilebilirlik garantisi
        değildir.
      </p>
      {Object.entries(groups).map(([key, label]) => {
        const findings = report.findings.filter((f) => f.group === key);
        if (!findings.length) return null;
        return (
          <details
            key={key}
            open={findings.some((f) => f.severity === "blocker")}
          >
            <summary>
              {label} · {findings.length} bulgu{" "}
              <span className="finding-counts">
                {findings.some((f) => f.severity === "blocker") && (
                  <StatusBadge tone="error">
                    {findings.filter((f) => f.severity === "blocker").length}{" "}
                    engelleyici
                  </StatusBadge>
                )}
                {findings.some((f) => f.severity === "warning") && (
                  <StatusBadge tone="warning">
                    {findings.filter((f) => f.severity === "warning").length}{" "}
                    uyarı
                  </StatusBadge>
                )}
              </span>
            </summary>
            <ul className="technical-findings">
              {findings.map((f, i) => (
                <li key={i}>
                  <strong>
                    {f.severity === "blocker"
                      ? "Engelleyici"
                      : f.severity === "warning"
                        ? "Yönetici değerlendirmesi"
                        : "Bilgi"}
                    : {f.message}
                  </strong>
                  <p className="form-help">
                    {f.file} · {f.location} · {f.rule}
                  </p>
                  {f.evidence && (
                    <pre>
                      <code>{f.evidence}</code>
                    </pre>
                  )}
                  <p>{f.remedy}</p>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
      <details>
        <summary>Tamamlanan kontroller ve sınırlar</summary>
        <p>{report.completedChecks.join(" · ") || "Tamamlanan kontrol yok."}</p>
        {report.scanner && <p className="form-help">{report.scanner}</p>}
        <ul>
          {report.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p>
          Statik erişilebilirlik:{" "}
          {report.accessibility === "complete"
            ? "HTML kuralları incelendi; manuel inceleme gerekli."
            : "Tamamlanamadı; manuel inceleme gerekli."}
        </p>
      </details>
    </section>
  );
}
