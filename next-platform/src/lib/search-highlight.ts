import { normalizeSearch } from "./catalog-model";

/** Literal query matching, using the catalogue's Turkish normalization. */
export function searchMatchRanges(
  text: string,
  query: string,
): [number, number][] {
  const needle = normalizeSearch(query.trim());
  if (!needle) return [];
  const haystack = normalizeSearch(text);
  const origins: { start: number; end: number }[] = [];
  // Keep combining accents attached so highlighting preserves the original text.
  for (const match of text.matchAll(/\P{M}\p{M}*|\p{M}+/gu)) {
    for (let i = 0; i < normalizeSearch(match[0]).length; i++) {
      origins.push({ start: match.index, end: match.index + match[0].length });
    }
  }
  const ranges: [number, number][] = [];
  for (
    let at = haystack.indexOf(needle);
    at !== -1;
    at = haystack.indexOf(needle, at + needle.length)
  ) {
    const start = origins[at]?.start;
    const end = origins[at + needle.length - 1]?.end;
    if (start === undefined || end === undefined) continue;
    const previous = ranges.at(-1);
    if (previous && start <= previous[1]) previous[1] = end;
    else ranges.push([start, end]);
  }
  return ranges;
}

export function searchExcerpt(text: string, query: string) {
  const match = searchMatchRanges(text, query)[0];
  if (!match) return null;
  const start = Math.max(0, match[0] - 24);
  const end = Math.min(text.length, Math.max(start + 100, match[1]));
  return `${start ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}
