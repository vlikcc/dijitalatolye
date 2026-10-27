"use client";
import {
  warningRules,
  type Assessment,
  type TechnicalReport,
} from "@/modules/review-types";
export const assessmentLabels = {
  science: "Bilimsel doğruluk",
  age: "Yaşa ve sınıfa uygunluk",
  education: "Eğitimsel kalite",
  accessibility: "Kullanılabilirlik ve erişilebilirlik",
  cover: "Kapak uygunluğu",
};
export function assessmentFromForm(
  form: FormData,
  report: TechnicalReport,
  items: { id: string; catalogId: string }[],
  excluded: string[],
): Assessment {
  return {
    ...Object.fromEntries(
      Object.keys(assessmentLabels).map((key) => [
        key,
        {
          status: String(form.get(`assessment.${key}`)),
          note: String(form.get(`note.${key}`) ?? ""),
        },
      ]),
    ),
    warnings: warningRules(report).map((rule) => ({
      rule,
      disposition: String(form.get(`warning.${rule}`)),
      note: String(form.get(`warning-note.${rule}`) ?? ""),
    })),
    outcomes: items.map((o) => ({
      catalogId: o.catalogId,
      outcomeId: o.id,
      status: excluded.includes(o.id)
        ? "exclude"
        : String(form.get(`outcome.${o.id}`)),
      note: String(form.get(`outcome-note.${o.id}`) ?? ""),
    })),
  } as Assessment;
}
export function AssessmentFields({
  report,
  disabled,
}: {
  report: TechnicalReport;
  disabled: boolean;
}) {
  return (
    <fieldset className="assessment-fields" disabled={disabled}>
      <legend>Eğitimsel değerlendirme</legend>
      <p>
        Oyunu önizlemede oynayarak her başlığı değerlendirin. Otomatik rapor bu
        kararların yerine geçmez.
      </p>
      {Object.entries(assessmentLabels).map(([key, label]) => (
        <div className="assessment-row" key={key}>
          <label htmlFor={`assessment-${key}`}>
            {label}
            <select
              aria-label={label}
              id={`assessment-${key}`}
              name={`assessment.${key}`}
              defaultValue="unassessed"
            >
              <option value="unassessed">Değerlendirilemedi</option>
              <option value="suitable">Uygun</option>
              <option value="revise">Düzeltme gerekli</option>
              {key === "science" && (
                <option value="not_applicable">
                  Uygulanamaz: bilimsel iddia yok
                </option>
              )}
            </select>
          </label>
          <label htmlFor={`note-${key}`}>
            {label} — inceleme notu
            <textarea
              id={`note-${key}`}
              name={`note.${key}`}
              rows={2}
              maxLength={1500}
              placeholder={
                key === "accessibility"
                  ? "Klavye, odak, okunabilirlik ve dinamik ekran incelemenizi yazın."
                  : "Varsa sorun veya değerlendirilemeyen durumun gerekçesi."
              }
            />
          </label>
        </div>
      ))}
      {!!warningRules(report).length && (
        <h3 id="assessment-warnings" tabIndex={-1}>
          Teknik rapor uyarıları
        </h3>
      )}
      {warningRules(report).map((rule) => {
        const findings = report.findings.filter((f) => f.rule === rule);
        return (
          <div className="assessment-warning" key={rule}>
            <p>
              <strong>{findings[0].message}</strong> · {findings.length} bulgu
            </p>
            <p className="form-help">{rule}</p>
            <label>
              Uyarı kararı — {rule}
              <select
                aria-label={`Uyarı kararı — ${rule}`}
                id={`warning-${rule}`}
                name={`warning.${rule}`}
                defaultValue="revise"
              >
                <option value="revise">Düzeltme gerekli</option>
                <option value="not_confirmed">
                  Önizlemede sorun doğrulanmadı
                </option>
                <option value="accepted_limitation">
                  Gerekçeli sınırlılıkla kabul edildi
                </option>
              </select>
            </label>
            <label>
              Uyarı gerekçesi — {rule}
              <textarea
                name={`warning-note.${rule}`}
                rows={2}
                maxLength={1500}
              />
            </label>
          </div>
        );
      })}
    </fieldset>
  );
}
