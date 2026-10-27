import { z } from "zod";
import { warningRules, type TechnicalReport } from "./review-types";
import type { OutcomeRef } from "./curriculum-types";
const item = z
  .object({
    status: z.enum(["suitable", "revise", "unassessed", "not_applicable"]),
    note: z.string().trim().max(1500),
  })
  .strict();
export const assessmentSchema = z
  .object({
    science: item,
    age: item,
    education: item,
    accessibility: item,
    cover: item,
    warnings: z
      .array(
        z
          .object({
            rule: z.string().max(100),
            disposition: z.enum([
              "not_confirmed",
              "accepted_limitation",
              "revise",
            ]),
            note: z.string().trim().min(5).max(1500),
          })
          .strict(),
      )
      .max(100),
    outcomes: z
      .array(
        z
          .object({
            catalogId: z.string().max(100),
            outcomeId: z.string().max(200),
            status: z.enum(["suitable", "exclude", "unassessed"]),
            note: z.string().trim().min(5).max(1500),
          })
          .strict(),
      )
      .max(20),
  })
  .strict();
export function assessmentItemIssue(
  key: string,
  entry: { status: string; note: string },
  approve: boolean,
) {
  const note = entry.note.trim();
  if (
    entry.status === "not_applicable" &&
    (key !== "science" || note.length < 5)
  )
    return "Uygulanamaz yalnızca bilimsel iddia içermeyen oyunlar için gerekçeyle kullanılabilir.";
  if (approve && !["suitable", "not_applicable"].includes(entry.status))
    return "Çözülmemiş eğitimsel inceleme varken yayın onaylanamaz.";
  if (
    (entry.status !== "suitable" || key === "accessibility") &&
    note.length < 5
  )
    return "Değerlendirmenin gerekçesini en az 5 karakterle yazın.";
  if (note.length > 1500)
    return "İnceleme notu en fazla 1500 karakter olabilir.";
}
export function validateAssessment(
  value: unknown,
  report: TechnicalReport,
  refs: OutcomeRef[],
  approve: boolean,
  excluded: string[],
) {
  const parsed = assessmentSchema.safeParse(value);
  if (!parsed.success)
    throw Error("Eğitimsel inceleme formunu ve gerekçeleri tamamlayın.");
  const a = parsed.data;
  for (const key of [
    "science",
    "age",
    "education",
    "accessibility",
    "cover",
  ] as const) {
    const entry = a[key];
    const issue = assessmentItemIssue(key, entry, approve);
    if (issue) throw Error(issue);
  }
  const rules = warningRules(report);
  if (
    new Set(a.warnings.map((w) => w.rule)).size !== a.warnings.length ||
    a.warnings.some((w) => !rules.includes(w.rule)) ||
    (approve && rules.some((r) => !a.warnings.some((w) => w.rule === r)))
  )
    throw Error("Teknik rapordaki bütün uyarıları değerlendirin.");
  if (approve && a.warnings.some((w) => w.disposition === "revise"))
    throw Error("Düzeltme bekleyen uyarı varken onay verilemez.");
  const key = (r: OutcomeRef) => r.catalogId + ":" + r.outcomeId;
  if (
    new Set(a.outcomes.map(key)).size !== a.outcomes.length ||
    a.outcomes.length !== refs.length ||
    a.outcomes.some((o) => !refs.some((r) => key(r) === key(o)))
  )
    throw Error("Her kazanım için ayrı uygunluk kararı gerekli.");
  if (
    approve &&
    a.outcomes.some(
      (o) =>
        o.status === "unassessed" ||
        (o.status === "exclude") !== excluded.includes(o.outcomeId),
    )
  )
    throw Error("Kazanım uygunluğu ve çıkarılan ilişkiler tutarlı olmalı.");
  return a;
}
