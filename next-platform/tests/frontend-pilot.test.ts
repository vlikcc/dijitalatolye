import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { catalogArtwork } from "../src/lib/catalog-artwork";
import type { CatalogGame } from "../src/lib/catalog-model";
import { GameInformation } from "../src/components/game-information";

const game: CatalogGame = {
  id: "example",
  slug: "example",
  title: "Örnek",
  description: "Yerel test",
  subject: "Matematik",
  subjectKey: "matematik",
  grade: 4,
  kind: "demo",
  author: "",
  objectives: [],
  teacherNotes: [],
};
describe("public frontend content boundaries", () => {
  it("uses only provided covers, prefers distinct subjects, and never repeats a cover", () => {
    const games = [
      { ...game, id: "missing" },
      { ...game, id: "math", cover: "/math.webp" },
      { ...game, id: "second-math", cover: "/math-2.webp" },
      { ...game, id: "duplicate", subjectKey: "fen", cover: "/math.webp" },
      { ...game, id: "science", subjectKey: "fen", cover: "/science.webp" },
      { ...game, id: "turkish", subjectKey: "turkce", cover: "/turkish.webp" },
    ];
    expect(catalogArtwork(games).map((g) => g.id)).toEqual([
      "math",
      "science",
      "turkish",
    ]);
    expect(catalogArtwork(games.slice(0, 3)).map((g) => g.id)).toEqual([
      "math",
      "second-math",
    ]);
    expect(catalogArtwork([])).toEqual([]);
    expect(catalogArtwork([game])).toEqual([]);
  });
  it("omits empty information and discloses only additional teacher notes", () => {
    const render = (values: Partial<CatalogGame>) =>
      renderToStaticMarkup(
        createElement(GameInformation, { game: { ...game, ...values } }),
      );
    expect(render({ author: " ", objectives: [" "], teacherNotes: [""] })).toBe(
      "",
    );
    expect(render({ teacherNotes: ["İlk not."] })).not.toContain("<details");
    const html = render({
      author: "Öğretmen",
      objectives: ["Hedef"],
      teacherNotes: ["İlk not.", "", "İkinci not.", "Üçüncü not."],
    });
    expect(html).toContain("Öğrenme hedefi");
    expect(html).toContain("Hazırlayan");
    expect(html).toContain("<p>İlk not.</p><details");
    expect(html).toContain("<summary>Diğer öğretmen notları</summary>");
    expect(html).toContain("İkinci not.");
    expect(html).toContain("Üçüncü not.");
    expect(html).not.toContain("<details open");
  });
});
