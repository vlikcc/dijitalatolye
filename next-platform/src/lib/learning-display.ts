export const learningDate = (date: string | Date) =>
  new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(date));
export function assignmentStatus(a: {
  closed?: boolean;
  archived?: boolean;
  membership?: string;
  completed?: boolean;
  started?: boolean;
  due_at?: string | Date | null;
  tracking?: boolean;
}) {
  const label = a.completed
    ? "Tamamlandı"
    : a.started
      ? a.tracking
        ? "Devam ediyor"
        : "Açıldı · Tamamlanma ölçülemiyor"
      : "Başlamadı";
  if (a.membership && a.membership !== "active")
    return `${label} · Sınıf üyeliği etkin değil`;
  if (a.closed || a.archived) return `${label} · Kapalı`;
  if (a.completed) return label;
  return a.due_at && new Date(a.due_at) < new Date()
    ? `${label} · Gecikmiş`
    : label;
}
