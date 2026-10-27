export type SubjectKey = "matematik" | "turkce" | "fen" | "hayat";
export const subjects: { key: SubjectKey; label: string; color: string }[] = [
  { key: "matematik", label: "Matematik", color: "violet" },
  { key: "turkce", label: "Türkçe", color: "coral" },
  { key: "fen", label: "Fen Bilimleri", color: "teal" },
  { key: "hayat", label: "Hayat Bilgisi", color: "amber" },
];
export type CatalogGame = {
  id: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  subjectKey: string;
  subjectId?: string;
  grade: number;
  minutes?: number;
  cover?: string;
  kind: "demo" | "published";
  author: string;
  mechanic?: string;
  objectives: string[];
  teacherNotes: string[];
  gameUrl?: string;
};
export type CatalogFilters = {
  q?: string;
  grade?: string;
  subject?: string;
  saved?: string;
};
export type SearchParams = Record<string, string | string[] | undefined>;
export function readFilters(params: SearchParams): CatalogFilters {
  const one = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : undefined;
  return {
    q: one("q")?.slice(0, 120),
    grade: one("grade"),
    subject: one("subject"),
    saved: one("saved") === "1" ? "1" : undefined,
  };
}
export function subjectKey(label: string) {
  return subjects.find((s) => s.label === label)?.key ?? "other";
}
export function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}
export function filterGames(games: CatalogGame[], filters: CatalogFilters) {
  const query = normalizeSearch(filters.q?.trim() ?? "");
  return games.filter(
    (game) =>
      (!filters.grade || String(game.grade) === filters.grade) &&
      (!filters.subject ||
        game.subjectKey === filters.subject ||
        game.subjectId === filters.subject) &&
      (!query ||
        normalizeSearch(
          `${game.title} ${game.description} ${game.subject}`,
        ).includes(query)),
  );
}
export function catalogHref(filters: CatalogFilters) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value) query.set(key, value);
  return `/kesfet${query.size ? `?${query}` : ""}`;
}
export function safeCatalogReturn(value?: string) {
  if (!value) return "/kesfet";
  try {
    const url = new URL(value, "https://catalog.invalid");
    return url.origin === "https://catalog.invalid" &&
      ["/", "/kesfet"].includes(url.pathname)
      ? `${url.pathname}${url.search}`
      : "/kesfet";
  } catch {
    return "/kesfet";
  }
}
