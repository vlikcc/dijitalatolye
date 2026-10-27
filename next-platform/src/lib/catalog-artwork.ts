import type { CatalogGame } from "./catalog-model";

/** Prefer different subjects, retaining catalogue order within each pass. */
export function catalogArtwork(games: CatalogGame[]) {
  const selected: CatalogGame[] = [];
  const covers = new Set<string>();
  const subjects = new Set<string>();
  for (const diverse of [true, false]) {
    for (const game of games) {
      if (!game.cover || covers.has(game.cover)) continue;
      if (diverse && subjects.has(game.subjectId ?? game.subjectKey)) continue;
      selected.push(game);
      covers.add(game.cover);
      subjects.add(game.subjectId ?? game.subjectKey);
      if (selected.length === 3) return selected;
    }
  }
  return selected;
}
