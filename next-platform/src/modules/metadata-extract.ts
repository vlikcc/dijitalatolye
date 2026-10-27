import { open } from "node:fs/promises";
import path from "node:path";
import { parse } from "parse5";
import * as acorn from "acorn";
import * as walk from "acorn-walk";
import { z } from "zod";
import type { FileRecord } from "../server/schema";
import type { Evidence, ExtractionReport } from "./curriculum-types";
export const EXTRACTOR_VERSION = "1.0.0";
const gameInfoBase = z
  .object({
    schemaVersion: z.literal(1),
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().max(3000).optional(),
    grade: z.number().int().min(1).max(12).optional(),
    subject: z.string().max(200).optional(),
    programId: z.string().max(200).optional(),
    outcomeCodes: z.array(z.string().max(100)).max(20).optional(),
  })
  .strict();
export const gameInfoSchema = z.union([gameInfoBase, gameInfoBase.extend({schemaVersion:z.literal(2),cover:z.object({path:z.string().min(1).max(250)}).strict().optional()}).strict()]);
export type ExtractionInput = {
  root: string;
  manifest: FileRecord[];
  entrypoint: string;
  versionId: string;
  sha256: string;
  catalogId: string | null;
  originalFilename?: string | null;
};
export async function extractMetadata(
  input: ExtractionInput,
): Promise<ExtractionReport> {
  const report: ExtractionReport = {
    status: "complete",
    versionId: input.versionId,
    sha256: input.sha256,
    entrypoint: input.entrypoint,
    catalogId: input.catalogId,
    extractorVersion: EXTRACTOR_VERSION,
    fields: {},
    codes: [],
    passages: [],
    warnings: [],
  };
  const deadline = Date.now() + 29_000;
  let remaining = 5 * 1024 * 1024,
    passageBytes = 0;
  const files = new Map(input.manifest.map((f) => [f.path, f]));
  const done = new Set<string>();
  const queue = ["dijitalatolye.json", input.entrypoint];
  const check = () => {
    if (Date.now() > deadline)
      throw Error("Bilgi çıkarımı süre sınırına ulaştı.");
  };
  const field = (
    name: keyof ExtractionReport["fields"],
    value: string | number | undefined,
    evidence: Evidence,
  ) => {
    if (value !== undefined && String(value).trim() && !report.fields[name])
      report.fields[name] = {
        value: typeof value === "string" ? value.trim() : value,
        evidence,
      };
  };
  const add = (text: string, file: string, location: string) => {
    check();
    text = text.replace(/\s+/g, " ").trim();
    if (
      text.length < 3 ||
      text.length > 3000 ||
      passageBytes > 100_000 ||
      /^(?:https?:|data:|\.\.?\/)/i.test(text)
    )
      return;
    const evidence = { file, location, text };
    if (report.passages.some((p) => p.text === text)) return;
    report.passages.push(evidence);
    passageBytes += Buffer.byteLength(text);
    for (const match of text.matchAll(
      /\b[A-ZÇĞİÖŞÜ]{1,12}\.?\d{1,2}(?:\.[A-ZÇĞİÖŞÜ\d]{1,8}){1,5}\.?/gu,
    )) {
      if (
        report.codes.length < 50 &&
        !report.codes.some((c) => c.code === match[0])
      )
        report.codes.push({ code: match[0], evidence });
    }
  };
  const link = (ref: string, file: string) => {
    if (!ref || /^(?:[a-z]+:|\/|#)/i.test(ref)) return;
    let decoded: string;
    try {
      decoded = decodeURIComponent(ref.split(/[?#]/)[0]);
    } catch {
      return;
    }
    const target = path.posix.normalize(
      path.posix.join(path.posix.dirname(file), decoded),
    );
    if (
      files.has(target) &&
      /\.(?:html?|m?js|json)$/i.test(target) &&
      !done.has(target)
    )
      queue.push(target);
  };
  while (queue.length) {
    check();
    const file = queue.shift()!;
    const f = files.get(file);
    if (!f || done.has(file)) continue;
    done.add(file);
    if (
      /(?:^|\/)(?:vendor|node_modules|lib|libs)\/|(?:\.min\.(?:js|mjs)$)|(?:^|\/)(?:jquery|react|three|phaser|pixi)(?:[.-])/i.test(
        file,
      )
    ) {
      report.warnings.push(`${file}: kütüphane metni önerilere katılmadı.`);
      continue;
    }
    if (remaining <= 0) {
      report.warnings.push("Toplam 5 MiB metin sınırına ulaşıldı.");
      break;
    }
    const bytes = Math.min(f.size, 1024 * 1024, remaining);
    const handle = await open(path.join(input.root, file), "r");
    let source: string;
    try {
      const buffer = Buffer.alloc(bytes);
      const n = await handle.read(buffer, 0, bytes, 0);
      source = buffer.subarray(0, n.bytesRead).toString("utf8");
      remaining -= n.bytesRead;
    } finally {
      await handle.close();
    }
    if (bytes < f.size)
      report.warnings.push(`${file}: metin boyut sınırında kesildi.`);
    const js = (text: string, lineOffset = 0) => {
      let ast: acorn.Node;
      try {
        ast = acorn.parse(text, {
          ecmaVersion: "latest",
          sourceType: "module",
          locations: true,
          allowReturnOutsideFunction: true,
        });
      } catch {
        report.warnings.push(`${file}: JavaScript metni okunamadı.`);
        return;
      }
      walk.simple(ast, {
        Literal(node: any) {
          if (typeof node.value === "string")
            add(
              node.value,
              file,
              `satır ${(node.loc?.start.line ?? 1) + lineOffset}`,
            );
        },
        TemplateLiteral(node: any) {
          if (!node.expressions.length)
            add(
              node.quasis
                .map((q: any) => q.value.cooked ?? q.value.raw)
                .join(""),
              file,
              `satır ${(node.loc?.start.line ?? 1) + lineOffset}`,
            );
        },
        ImportDeclaration(node: any) {
          link(String(node.source.value), file);
        },
        ExportNamedDeclaration(node: any) {
          if (node.source) link(String(node.source.value), file);
        },
        ImportExpression(node: any) {
          if (typeof node.source.value === "string")
            link(node.source.value, file);
        },
        CallExpression(node: any) {
          if (
            node.callee.name === "fetch" &&
            typeof node.arguments[0]?.value === "string"
          )
            link(node.arguments[0].value, file);
        },
      });
    };
    if (/\.html?$/i.test(file)) {
      const tree = parse(source, { sourceCodeLocationInfo: true });
      const textOf = (n: any): string =>
        n.nodeName === "#text"
          ? n.value
          : (n.childNodes ?? []).map(textOf).join(" ");
      const visit = (n: any, ignored = false) => {
        check();
        const attrs = Object.fromEntries(
          (n.attrs ?? []).map((a: any) => [a.name, a.value]),
        );
        const location = `satır ${n.sourceCodeLocation?.startLine ?? 1}`;
        const text = textOf(n).replace(/\s+/g, " ").trim();
        if (n.tagName === "meta" && file === input.entrypoint) {
          const name = attrs.name || attrs.property;
          if (["og:title", "twitter:title"].includes(name))
            field("title", attrs.content, {
              file,
              location,
              text: attrs.content,
            });
          if (["description", "og:description"].includes(name))
            field("description", attrs.content, {
              file,
              location,
              text: attrs.content,
            });
        }
        if (file === input.entrypoint && n.tagName === "title")
          field("title", text, { file, location, text });
        if (n.tagName === "script") {
          if (attrs.src) link(attrs.src, file);
          else if (!attrs.type || /(?:javascript|module)/i.test(attrs.type))
            js(textOf(n), (n.sourceCodeLocation?.startLine ?? 1) - 1);
          else if (attrs.type === "application/json")
            try {
              json(JSON.parse(textOf(n)), "script");
            } catch {}
          return;
        }
        if (
          ["style", "noscript", "template"].includes(n.tagName) ||
          "hidden" in attrs ||
          attrs["aria-hidden"] === "true"
        )
          return;
        if (attrs.href) link(attrs.href, file);
        if (n.nodeName === "#text" && !ignored) add(n.value, file, location);
        for (const c of n.childNodes ?? [])
          visit(c, ignored || n.tagName === "head");
      };
      const json = (value: unknown, pointer: string): void => {
        if (typeof value === "string") add(value, file, pointer);
        else if (value && typeof value === "object")
          for (const [k, v] of Object.entries(value))
            json(v, `${pointer}/${k}`);
      };
      visit(tree);
      if (file === input.entrypoint && !report.fields.title) {
        const find = (n: any): any =>
          n.tagName === "h1" ? n : (n.childNodes ?? []).map(find).find(Boolean);
        const h = find(tree);
        if (h)
          field("title", textOf(h), {
            file,
            location: `satır ${h.sourceCodeLocation?.startLine ?? 1}`,
            text: textOf(h),
          });
      }
      if (file === input.entrypoint && !report.fields.description) {
        const find = (n: any): any =>
          /^(?:instructions|how-to-play|yonerge|yönerge)$/i.test(
            (n.attrs ?? []).find((a: any) => a.name === "id")?.value ?? "",
          )
            ? n
            : (n.childNodes ?? []).map(find).find(Boolean);
        const h = find(tree);
        if (h)
          field("description", textOf(h).slice(0, 3000), {
            file,
            location: `satır ${h.sourceCodeLocation?.startLine ?? 1}`,
            text: textOf(h).slice(0, 3000),
          });
      }
    } else if (/\.m?js$/i.test(file)) js(source);
    else if (/\.json$/i.test(file)) {
      try {
        const d: unknown = JSON.parse(source);
        if (file === "dijitalatolye.json") {
          const parsed = gameInfoSchema.safeParse(d);
          if (!parsed.success)
            report.warnings.push(
              "dijitalatolye.json geçersiz; alanlar otomatik kabul edilmedi.",
            );
          else {
            for (const key of [
              "title",
              "description",
              "grade",
              "subject",
              "programId",
            ] as const)
              field(key, parsed.data[key], {
                file,
                location: `/${key}`,
                text: String(parsed.data[key] ?? ""),
              });
            for (const code of parsed.data.outcomeCodes ?? [])
              report.codes.push({
                code,
                evidence: { file, location: "/outcomeCodes", text: code },
              });
          }
        } else {
          const visit = (v: unknown, p: string, depth = 0): void => {
            check();
            if (depth > 30) return;
            if (typeof v === "string") add(v, file, p);
            else if (v && typeof v === "object")
              for (const [k, c] of Object.entries(v))
                visit(c, `${p}/${k}`, depth + 1);
          };
          visit(d, "", 0);
        }
      } catch {
        report.warnings.push(`${file}: JSON metni okunamadı.`);
      }
    }
  }
  if (!report.fields.title) {
    const text = path
      .basename(input.originalFilename ?? input.entrypoint)
      .replace(/\.(zip|html?)$/i, "")
      .replace(/[_-]/g, " ")
      .slice(0, 120);
    field("title", text, {
      file: input.originalFilename ?? input.entrypoint,
      location: "dosya adı (öneri)",
      text,
    });
  }
  report.status = report.warnings.length ? "partial" : "complete";
  return report;
}
