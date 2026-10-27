import { assignmentStatus, learningDate } from "./learning-display";
import type { ReportRow } from "./learning-workspace";

export type ReportAssignment = {
  id: string;
  title: string;
  class_name: string;
  game_title: string;
  tracking: boolean;
  closed: boolean;
  due_at: string | Date | null;
};
export const resultHeaders = [
  "Öğrenci",
  "Kullanıcı adı",
  "Durum",
  "İlerleme (%)",
  "Son puan",
  "En iyi puan",
  "Deneme sayısı",
  "Son etkinlik (İstanbul)",
] as const;
export function reportRowStatus(a: ReportAssignment, r: ReportRow) {
  return assignmentStatus({
    ...a,
    membership: r.membership,
    started: r.attempts > 0,
    completed: a.tracking && !!r.completed,
  });
}
export function trackingDescription(tracking: boolean) {
  return tracking
    ? "Puan ve ilerleme oyunun bildirdiği sonuçlardır. Son puan en yeni denemeyi, en iyi puan tüm denemeleri gösterir."
    : "Yalnızca açılma bilgisi izlenir. Tamamlanma, puan ve ilerleme ölçülemez.";
}
export function resultCells(a: ReportAssignment, r: ReportRow) {
  return [
    r.name,
    r.username,
    reportRowStatus(a, r),
    a.tracking ? r.progress : null,
    a.tracking ? r.score : null,
    a.tracking ? r.best_score : null,
    r.attempts,
    r.last_activity ? learningDate(r.last_activity) : null,
  ];
}
// Quoting handles separators/newlines; the apostrophe prevents spreadsheet
// formula interpretation, including formulas preceded by whitespace/controls.
function csvCell(value: string | number | null) {
  let text = value === null ? "" : String(value);
  if (
    typeof value === "string" &&
    (/^[\s\u0000-\u001f]*[=+@-]/u.test(text) || /^[\t\r\n]/.test(text))
  )
    text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
export function assignmentCsv(a: ReportAssignment, rows: ReportRow[]) {
  const records = [
    ["Sınıf", "Ödev", "Oyun", "Takip kapsamı", ...resultHeaders],
    ...rows.map((r) => [
      a.class_name,
      a.title,
      a.game_title,
      a.tracking ? "İlerleme, puan ve tamamlanma" : "Yalnızca açılma bilgisi",
      ...resultCells(a, r),
    ]),
  ];
  return (
    "\uFEFF" +
    records.map((r) => r.map(csvCell).join(";")).join("\r\n") +
    "\r\n"
  );
}
