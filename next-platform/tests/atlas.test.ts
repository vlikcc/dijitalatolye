import { describe, expect, it } from "vitest";
import { demoGames } from "../src/games/demos";
import { demoDocument } from "../src/games/demo-document";
import {
  catalogHref,
  filterGames,
  readFilters,
  safeCatalogReturn,
  type CatalogGame,
} from "../src/lib/catalog-model";
describe("bundled activities", () => {
  it("provides 16 valid, distinct games spanning four mechanics", () => {
    expect(demoGames).toHaveLength(16);
    expect(new Set(demoGames.map((g) => g.slug)).size).toBe(16);
    expect(
      new Set(demoGames.flatMap((g) => g.rounds.map((r) => r.type))).size,
    ).toBe(4);
    for (const game of demoGames) {
      expect(game.grade).toBeGreaterThanOrEqual(3);
      expect(game.grade).toBeLessThanOrEqual(8);
      expect(game.rounds.length).toBeGreaterThanOrEqual(2);
      for (const round of game.rounds) {
        if (round.type === "choice")
          expect(round.options).toContain(round.answer);
        if (round.type === "match") {
          expect(new Set(round.pairs.map((p) => p[0])).size).toBe(
            round.pairs.length,
          );
          expect(new Set(round.pairs.map((p) => p[1])).size).toBe(
            round.pairs.length,
          );
        }
        if (round.type === "order")
          expect(new Set(round.items).size).toBe(round.items.length);
        if (round.type === "sort")
          round.items.forEach((item) =>
            expect(round.groups).toContain(item.group),
          );
      }
    }
  });
  it("escapes text and JSON when producing standalone HTML", () => {
    const doc = demoDocument({
      ...demoGames[0],
      title: "</script><script>alert(1)</script>",
    });
    expect(doc).not.toContain("</script><script>alert(1)");
    expect(doc).toContain("&lt;/script&gt;");
    expect(doc).toContain("\\u003c/script>");
  });
});
describe("catalog navigation", () => {
  const games = [
    {
      slug: "demo",
      title: "Sözcük Eşleri",
      description: "Eş anlamlı sözcükleri keşfet.",
      subject: "Türkçe",
      subjectKey: "turkce",
      subjectId: "subject-id",
      grade: 3,
    },
  ] as CatalogGame[];
  it("combines Turkish search, subject and grade without treating zero matches as all items", () => {
    expect(
      filterGames(games, { q: "SOZCUK", grade: "3", subject: "turkce" }),
    ).toHaveLength(1);
    expect(filterGames(games, { subject: "subject-id" })).toHaveLength(1);
    expect(filterGames(games, { grade: "4" })).toHaveLength(0);
    expect(filterGames(games, { q: "gezegen" })).toHaveLength(0);
  });
  it("round-trips only the supported filter fields", () => {
    const filters = readFilters({
      q: "kesir",
      saved: "1",
      subject: "matematik",
      grade: ["3", "4"],
    });
    expect(catalogHref(filters)).toBe(
      "/kesfet?q=kesir&subject=matematik&saved=1",
    );
  });
  it("keeps a local discovery return path and rejects external or unrelated paths", () => {
    expect(safeCatalogReturn("/kesfet?grade=4&subject=matematik")).toBe(
      "/kesfet?grade=4&subject=matematik",
    );
    for (const url of [
      "//evil.example/",
      "https://evil.example/kesfet",
      "javascript:alert(1)",
      "/yonetim",
    ])
      expect(safeCatalogReturn(url)).toBe("/kesfet");
  });
});
