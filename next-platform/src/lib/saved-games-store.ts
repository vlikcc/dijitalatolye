export const savedGamesKey = "dijital-oyun-atolyesi:saved:v1";

export function savedGamesSnapshot() {
  try {
    return localStorage.getItem(savedGamesKey) ?? "[]";
  } catch {
    return "[]";
  }
}
export function parseSavedGames(raw: string) {
  try {
    const values: unknown = JSON.parse(raw);
    return new Set<string>(
      Array.isArray(values)
        ? values.filter((v): v is string => typeof v === "string")
        : [],
    );
  } catch {
    return new Set<string>();
  }
}
export function subscribeSavedGames(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("atlas-saved", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("atlas-saved", listener);
  };
}
export function updateSavedGame(slug: string, action: boolean | "toggle") {
  try {
    // Read at the time of the operation, including changes made in another tab.
    const next = parseSavedGames(localStorage.getItem(savedGamesKey) ?? "[]");
    const saved = action === "toggle" ? !next.has(slug) : action;
    if (saved) next.add(slug);
    else next.delete(slug);
    localStorage.setItem(savedGamesKey, JSON.stringify([...next]));
    window.dispatchEvent(new Event("atlas-saved"));
    return { ok: true, saved } as const;
  } catch {
    return { ok: false } as const;
  }
}
