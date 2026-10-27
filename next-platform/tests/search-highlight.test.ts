import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { searchMatchRanges, searchExcerpt } from "../src/lib/search-highlight";
import { HighlightText } from "../src/components/highlight-text";

const marked = (text: string, query: string) =>
  searchMatchRanges(text, query).map(([a, b]) => text.slice(a, b));
describe("catalogue search highlighting", () => {
  it("matches Turkish case and accents without changing displayed spelling", () => {
    expect(marked("IŞIK, ışık, İŞİK, işik", "isik")).toEqual([
      "IŞIK",
      "ışık",
      "İŞİK",
      "işik",
    ]);
    expect(marked("Sözcük Eşleri, Çığ ve Güneş", "sozcuk")).toEqual(["Sözcük"]);
    expect(marked("🙂 I\u0307ŞIK sözcük", "ışık")).toEqual(["I\u0307ŞIK"]);
    expect(marked("🙂 I\u0307ŞIK sözcük", "sozcuk")).toEqual(["sözcük"]);
  });
  it("uses the whole literal query, including punctuation, and handles empty or absent matches", () => {
    expect(marked("(a+b) ve a.b", "(a+b)")).toEqual(["(a+b)"]);
    expect(marked("Sözcük ve Eşleri", "sözcük eşleri")).toEqual([]);
    expect(marked("Sözcük Eşleri", "  ")).toEqual([]);
    expect(marked("Sözcük Eşleri", "zz")).toEqual([]);
    expect(marked("aaaa", "aa")).toEqual(["aaaa"]);
  });
  it("renders untrusted text safely and preserves text around the mark", () => {
    const html = renderToStaticMarkup(
      createElement(HighlightText, {
        text: "Önce <script>alert(1)</script> sonra",
        query: "alert(1)",
      }),
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain('<mark class="search-match">alert(1)</mark>');
    expect(html).toContain(" sonra");
  });
  it("returns a bounded description excerpt only around a real match", () => {
    expect(searchExcerpt("Sözcükleri düzenle.", "bul")).toBeNull();
    const excerpt = searchExcerpt(
      `${"a ".repeat(80)}Sözcük Eşleri ${"b ".repeat(80)}`,
      "sözcük",
    );
    expect(excerpt).toContain("Sözcük");
    expect(excerpt?.startsWith("…")).toBe(true);
    expect(excerpt?.length).toBeLessThanOrEqual(102);
  });
});
