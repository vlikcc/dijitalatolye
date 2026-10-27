export type WorkspaceParams = Record<string, string | string[] | undefined>;
export type ContentFilter = "all" | "attention" | "review" | "live";
const value = (input: string | string[] | undefined) =>
  typeof input === "string" ? input : "";
export function readWorkspaceFilters(params: WorkspaceParams) {
  const grade = value(params.sinif);
  const subject = value(params.ders);
  const status = value(params.durum);
  return {
    query: value(params.q).trim().slice(0, 120),
    status: (["attention", "review", "live"].includes(status)
      ? status
      : "all") as ContentFilter,
    grade: /^(?:[1-9]|1[0-2])$/.test(grade) ? grade : "",
    subject:
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
        subject,
      )
        ? subject
        : "",
    sort: value(params.siralama) === "newest" ? "newest" : "oldest",
    page: Math.max(
      1,
      Math.min(10000, Number.parseInt(value(params.sayfa), 10) || 1),
    ),
  };
}
export function listPage(total: number, requested: number, size = 25) {
  const page = Math.min(requested, Math.max(1, Math.ceil(total / size)));
  return { page, offset: (page - 1) * size };
}
export function listHref(
  pathname: string,
  params: Record<string, string | undefined>,
) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value) q.set(key, value);
  return pathname + (q.size ? `?${q}` : "");
}
