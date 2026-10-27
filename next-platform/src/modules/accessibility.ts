import { parse } from "parse5";
import type { Finding } from "./review-types";
export function inspectAccessibility(source: string, file: string): Finding[] {
  const tree = parse(source, { sourceCodeLocationInfo: true });
  const nodes: any[] = [];
  const visit = (n: any) => {
    nodes.push(n);
    for (const child of n.childNodes ?? []) visit(child);
  };
  visit(tree);
  const attr = (n: any, name: string) =>
    n?.attrs?.find((a: any) => a.name === name)?.value;
  const text = (n: any): string =>
    n.nodeName === "#text"
      ? n.value
      : ["script", "style"].includes(n.tagName)
        ? ""
        : (n.childNodes ?? []).map(text).join(" ").trim();
  const ids = new Map(
    nodes.filter((n) => attr(n, "id")).map((n) => [attr(n, "id"), n]),
  );
  const labels = new Set(
    nodes
      .filter((n) => n.tagName === "label" && text(n))
      .map((n) => attr(n, "for")),
  );
  const findings: Finding[] = [];
  const add = (node: any, rule: string, message: string, remedy: string) => {
    const l = node?.sourceCodeLocation;
    findings.push({
      rule: "a11y." + rule,
      group: "accessibility",
      severity: "warning",
      file,
      location: l ? `${l.startLine}:${l.startCol}` : "Belge",
      evidence: l
        ? source.slice(
            l.startOffset,
            Math.min(l.startOffset + 200, l.endOffset),
          )
        : "",
      message,
      remedy,
    });
  };
  const html = nodes.find((n) => n.tagName === "html");
  const lang = attr(html, "lang");
  try {
    if (!lang || !Intl.getCanonicalLocales(lang).length) throw Error();
  } catch {
    add(
      html,
      "language",
      "Sayfa dili belirtilmemiş veya geçersiz.",
      "html öğesine geçerli bir lang niteliği ekleyin; Türkçe için tr kullanın.",
    );
  }
  const title = nodes.find((n) => n.tagName === "title");
  if (!title || !text(title))
    add(
      title,
      "title",
      "Sayfanın başlığı boş.",
      "Oyunu tanımlayan bir title metni ekleyin.",
    );
  for (const n of nodes) {
    if (n.tagName === "img" && attr(n, "alt") === undefined)
      add(
        n,
        "image-alt",
        "Görselin alternatif metin niteliği yok.",
        'Anlamlı görsele açıklama, dekoratif görsele alt="" ekleyin.',
      );
    const labelled = attr(n, "aria-labelledby");
    const refs = labelled?.trim().split(/\s+/) ?? [];
    if (
      labelled !== undefined &&
      (!refs.length || refs.some((id: string) => !ids.has(id)))
    )
      add(
        n,
        "label-reference",
        "aria-labelledby bulunmayan bir öğeye başvuruyor.",
        "Başvurulan kimlikleri düzeltin.",
      );
    if (
      ["input", "select", "textarea", "button"].includes(n.tagName) &&
      attr(n, "type") !== "hidden"
    ) {
      const parentLabel = (() => {
        let p = n.parentNode;
        while (p) {
          if (p.tagName === "label" && text(p)) return true;
          p = p.parentNode;
        }
        return false;
      })();
      const named =
        attr(n, "aria-label")?.trim() ||
        refs.some((id: string) => ids.has(id) && text(ids.get(id))) ||
        (labels.has(attr(n, "id")) && !!attr(n, "id")) ||
        parentLabel ||
        (n.tagName === "button" && text(n)) ||
        (n.tagName === "input" &&
          ["submit", "reset"].includes(attr(n, "type"))) ||
        (n.tagName === "input" &&
          attr(n, "type") === "button" &&
          attr(n, "value")?.trim());
      if (!named)
        add(
          n,
          "control-label",
          "Kontrolün statik HTML içinde erişilebilir etiketi bulunamadı.",
          "Görünür label, anlamlı düğme metni veya uygun erişilebilir ad ekleyin; dinamik etiketi önizlemede kontrol edin.",
        );
    }
    if (
      n.tagName === "canvas" &&
      !text(n) &&
      !attr(n, "aria-label") &&
      !labelled
    )
      add(
        n,
        "canvas",
        "Canvas için metinsel alternatif bulunamadı.",
        "Oyunun yönergesini ve erişilebilir alternatifini ekleyin; klavye kullanımını önizlemede kontrol edin.",
      );
  }
  return findings;
}
