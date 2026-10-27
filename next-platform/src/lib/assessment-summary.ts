import {
  assessmentItemIssue,
  assessmentSchema,
  validateAssessment,
} from "../modules/assessment";
import {
  warningRules,
  type Assessment,
  type TechnicalReport,
} from "../modules/review-types";
import type { OutcomeRef } from "../modules/curriculum-types";
const labels = {
  science: "Bilimsel doğruluk",
  age: "Yaşa ve sınıfa uygunluk",
  education: "Eğitimsel kalite",
  accessibility: "Kullanılabilirlik ve erişilebilirlik",
  cover: "Kapak uygunluğu",
};
export function assessmentSummary(
  a: Assessment,
  report: TechnicalReport,
  refs: OutcomeRef[],
  excluded: string[],
) {
  const missing: { id: string; label: string }[] = [];
  let decisions = 0,
    warnings = 0,
    outcomes = 0;
  for (const key of Object.keys(labels) as (keyof typeof labels)[]) {
    const entry = a[key];
    if (
      entry &&
      assessmentSchema.shape[key].safeParse(entry).success &&
      entry.status !== "unassessed" &&
      !assessmentItemIssue(key, entry, false)
    )
      decisions++;
    else
      missing.push({
        id: `assessment-${key}`,
        label: `${labels[key]}: karar ve gerekçeyi kontrol edin`,
      });
  }
  for (const rule of warningRules(report)) {
    const entry = a.warnings.find((w) => w.rule === rule);
    if (assessmentSchema.shape.warnings.element.safeParse(entry).success)
      warnings++;
    else
      missing.push({
        id: `warning-${rule}`,
        label: `${rule}: uyarı gerekçesini tamamlayın`,
      });
  }
  for (const ref of refs) {
    const entry = a.outcomes.find(
      (o) => o.catalogId === ref.catalogId && o.outcomeId === ref.outcomeId,
    );
    if (
      entry?.status !== "unassessed" &&
      assessmentSchema.shape.outcomes.element.safeParse(entry).success
    )
      outcomes++;
    else
      missing.push({
        id: `assessment-outcome-${ref.outcomeId}`,
        label: `${ref.outcomeId}: kazanım kararı ve gerekçesini tamamlayın`,
      });
  }
  let approvalIssue = "";
  try {
    validateAssessment(a, report, refs, true, excluded);
  } catch (e) {
    approvalIssue = (e as Error).message;
  }
  return { decisions, warnings, outcomes, missing, approvalIssue };
}
