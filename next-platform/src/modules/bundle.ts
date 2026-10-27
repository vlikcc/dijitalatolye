import yauzl from "yauzl";
import { createWriteStream, createReadStream } from "node:fs";
import { mkdir, readFile, stat, rename, readdir } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";
import { parse } from "parse5";
import { inspectJavaScript } from "./code-policy";
import { inspectAccessibility } from "./accessibility";
import type { Finding } from "./review-types";
import postcss from "postcss";
import valueParser from "postcss-value-parser";
import { hashFile } from "./storage";
import type { FileRecord } from "../server/schema";
export const limits = {
  upload: 50 * 1024 * 1024,
  files: 500,
  expanded: 200 * 1024 * 1024,
};
const allowed = new Set([
  ".html",
  ".htm",
  ".js",
  ".mjs",
  ".css",
  ".json",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".svg",
  ".mp3",
  ".wav",
  ".ogg",
  ".mp4",
  ".webm",
  ".woff",
  ".woff2",
  ".ttf",
  ".txt",
]);
export class BundleError extends Error {
  constructor(
    message: string,
    public finding?: Finding,
  ) {
    super(message);
  }
}
export function safePath(raw: string) {
  if (
    !raw ||
    raw.includes("\\") ||
    raw.includes("\0") ||
    raw.startsWith("/") ||
    /[\x00-\x1f:#?%]/.test(raw)
  )
    throw new BundleError("Geçersiz dosya yolu.");
  const parts = raw.normalize("NFC").split("/");
  if (parts.some((p) => !p || p === "." || p === ".."))
    throw new BundleError("Güvenli olmayan dosya yolu.");
  return parts.join("/");
}
function extension(name: string) {
  if (!allowed.has(path.extname(name).toLowerCase()))
    throw new BundleError(`Desteklenmeyen dosya türü: ${name}`);
}
export async function extractBundle(
  input: string,
  format: string,
  dest: string,
): Promise<FileRecord[]> {
  await mkdir(dest, { recursive: true });
  let total = 0;
  const manifest: FileRecord[] = [];
  const seen = new Set<string>();
  async function write(
    name: string,
    stream: NodeJS.ReadableStream,
    declared?: number,
  ) {
    name = safePath(name);
    extension(name);
    const key = name.toLocaleLowerCase("en-US");
    if (seen.has(key))
      throw new BundleError("Tekrarlanan veya büyük/küçük harf çakışan dosya.");
    seen.add(key);
    if (seen.size > limits.files)
      throw new BundleError("Paket 500 dosyayı aşamaz.");
    if (
      declared !== undefined &&
      (declared > limits.expanded || total + declared > limits.expanded)
    )
      throw new BundleError("Açılmış içerik limiti aşıldı.");
    const target = path.join(dest, name);
    await mkdir(path.dirname(target), { recursive: true });
    let size = 0;
    await pipeline(
      stream,
      new Transform({
        transform(chunk, _e, cb) {
          size += chunk.length;
          total += chunk.length;
          if (total > limits.expanded)
            cb(new BundleError("Açılmış içerik limiti aşıldı."));
          else cb(null, chunk);
        },
      }),
      createWriteStream(target, { flags: "wx" }),
    );
    if (declared !== undefined && size !== declared)
      throw new BundleError("Arşiv boyutu tutarsız.");
    manifest.push({ path: name, size, sha256: await hashFile(target) });
  }
  if (format === "html")
    await write(
      "index.html",
      createReadStream(input),
      (await stat(input)).size,
    );
  else
    await new Promise<void>((resolve, reject) => {
      yauzl.open(
        input,
        { lazyEntries: true, validateEntrySizes: true, strictFileNames: true },
        (error, zip) => {
          if (error || !zip)
            return reject(new BundleError("ZIP paketi açılamadı."));
          let entries = 0;
          let ended = false;
          const abort = (e: unknown) => {
            if (ended) return;
            ended = true;
            zip.close();
            reject(e);
          };
          zip.on("error", abort);
          zip.on("end", () => {
            ended = true;
            resolve();
          });
          zip.on("entry", (entry: yauzl.Entry) => {
            void (async () => {
              if (++entries > limits.files)
                throw new BundleError("Paket 500 girdiyi aşamaz.");
              if (entry.generalPurposeBitFlag & 1)
                throw new BundleError("Şifreli arşiv desteklenmiyor.");
              const mode = (entry.externalFileAttributes >>> 16) & 0xf000;
              if (mode === 0xa000)
                throw new BundleError("Sembolik bağlantı desteklenmiyor.");
              if (entry.fileName.endsWith("/")) {
                safePath(entry.fileName.slice(0, -1));
                zip.readEntry();
                return;
              }
              if (mode !== 0 && mode !== 0x8000)
                throw new BundleError("Özel dosya desteklenmiyor.");
              const stream = await new Promise<NodeJS.ReadableStream>(
                (res, rej) =>
                  zip.openReadStream(entry, (e, s) =>
                    e || !s ? rej(e) : res(s),
                  ),
              );
              await write(entry.fileName, stream, entry.uncompressedSize);
              zip.readEntry();
            })().catch(abort);
          });
          zip.readEntry();
        },
      );
    });
  if (!manifest.length) throw new BundleError("Paket boş.");
  const prefix = manifest[0].path.split("/")[0];
  if (manifest.every((f) => f.path.startsWith(prefix + "/"))) {
    const source = path.join(dest, prefix);
    for (const entry of await readdir(source))
      await rename(path.join(source, entry), path.join(dest, entry));
    for (const f of manifest) f.path = f.path.slice(prefix.length + 1);
  }
  return manifest;
}
export function checkReference(ref: string, from: string, files: Set<string>) {
  const reject=(rule:string,message:string):never=>{throw new BundleError(message,{rule,severity:"blocker",group:"resources",file:from,location:"Kaynak URL",evidence:ref.slice(0,240),message,remedy:"Kaynağı pakete ekleyin ve büyük/küçük harfleri koruyan göreli bir dosya yolu kullanın."});};
  ref = ref.trim();
  if (!ref || ref.startsWith("#")) return;
  if (/^data:(image|audio|font)\//i.test(ref)) return;
  if (
    /^[a-z][a-z\d+.-]*:/i.test(ref) ||
    ref.startsWith("//") ||
    ref.startsWith("/")
  )
    reject("resources.external",`Harici veya kökten başlayan kaynak desteklenmiyor: ${from}`);
  let decoded: string;
  try {
    decoded = decodeURIComponent(ref.split(/[?#]/)[0]);
  } catch {
    return reject("resources.invalid-url","Geçersiz kaynak URL’si.");
  }
  const normalized = path.posix.normalize(
    path.posix.join(path.posix.dirname(from), decoded),
  );
  if (normalized.startsWith("../") || !files.has(normalized))
    reject("resources.missing",`Kaynak bulunamadı (harf büyüklüğünü kontrol edin): ${from} → ${ref}`);
}
export async function validateSources(
  root: string,
  manifest: FileRecord[],
  selected?: string,
) {
  const files = new Set(manifest.map((f) => f.path));
  const candidates = manifest
    .map((f) => f.path)
    .filter((p) => /\.html?$/i.test(p));
  if (!candidates.length)
    throw new BundleError("Paket HTML giriş dosyası içermeli.");
  let entrypoint = selected;
  if (!entrypoint) {
    if (files.has("manifest.json")) {
      const m = JSON.parse(
        await readFile(path.join(root, "manifest.json"), "utf8"),
      );
      entrypoint = m.entrypoint;
    }
    entrypoint ??= files.has("index.html")
      ? "index.html"
      : candidates.length === 1
        ? candidates[0]
        : undefined;
  }
  if (entrypoint && !candidates.includes(entrypoint))
    throw new BundleError("Seçilen HTML giriş dosyası bulunamadı.");
  const check = (s: string, f: string) => checkReference(s, f, files);
  const findings: Finding[] = [];
  let accessibility: "complete" | "unavailable" = "complete";
  const js = (source: string, f: string, line = 1, col = 1) => {
    let result: Finding[];
    try {
      result = inspectJavaScript(source, f, (ref) => check(ref, f));
    } catch (e) {
      if (e instanceof BundleError) throw e;
      throw new BundleError(`JavaScript çözümlenemedi: ${f}`);
    }
    for(const finding of result) {
      const [l,c]=finding.location.split(":").map(Number);
      finding.location=`${l+line-1}:${l===1?c+col-1:c}`;
    }
    const blocked = result.find((x) => x.severity === "blocker");
    if (blocked) throw new BundleError(blocked.message, blocked);
    findings.push(...result);
  };
  const css = (source: string, f: string) => {
    try {
      postcss.parse(source).walkDecls((d) => {
        valueParser(d.value).walk((n) => {
          if (n.type === "function" && n.value.toLowerCase() === "url")
            check(
              valueParser.stringify(n.nodes).replace(/^['"]|['"]$/g, ""),
              f,
            );
        });
      });
      postcss.parse(source).walkAtRules("import", (r) => {
        const m = r.params.match(/(?:url\()?['"]?([^'"\s)]+)/);
        if (m) check(m[1], f);
      });
    } catch (e) {
      if (e instanceof BundleError) throw e;
      throw new BundleError(`CSS çözümlenemedi: ${f}`);
    }
  };
  for (const f of manifest) {
    if (!/\.(html?|js|mjs|css|svg)$/i.test(f.path)) continue;
    if (f.size > 5 * 1024 * 1024)
      throw new BundleError("Tek kaynak kod dosyası 5 MB sınırını aşıyor.");
    const source = await readFile(path.join(root, f.path), "utf8");
    if (/\.(js|mjs)$/i.test(f.path)) js(source, f.path);
    else if (/\.css$/i.test(f.path)) css(source, f.path);
    else {
      const visit = (node: any) => {
        const loc=node.sourceCodeLocation;
        const block=(rule:string,message:string)=>{throw new BundleError(message,{rule,severity:"blocker",group:"code",file:f.path,location:loc?`${loc.startLine}:${loc.startCol}`:"Belge",evidence:loc?source.slice(loc.startOffset,Math.min(loc.startOffset+200,loc.endOffset)):"",message,remedy:"Bu öğeyi kaldırıp oyunun yerel arayüzünü kullanın."});};
        const attrs = node.attrs || [];
        if (
          ["iframe", "object", "embed", "base", "form"].includes(node.tagName)
        )
          block("code.html-element",`Desteklenmeyen HTML öğesi: ${node.tagName}`);
        for (const a of attrs) {
          if (["src", "href", "poster", "data", "xlink:href"].includes(a.name))
            check(a.value, f.path);
          if (a.name === "srcset")
            for (const v of a.value.split(","))
              check(v.trim().split(/\s/)[0], f.path);
          if (a.name === "style") css(`x{${a.value}}`, f.path);
          if (a.name.startsWith("on")) js(a.value, f.path,loc?.attrs?.[a.name]?.startLine,loc?.attrs?.[a.name]?.startCol);
          if (a.name === "http-equiv" && a.value.toLowerCase() === "refresh")
            block("code.meta-refresh","Otomatik yönlendirme desteklenmiyor.");
        }
        const text = (node.childNodes || [])
          .filter((c: any) => c.nodeName === "#text")
          .map((c: any) => c.value)
          .join("");
        if (
          node.tagName === "script" &&
          !attrs.some((a: any) => a.name === "src") &&
          !attrs.some(
            (a: any) =>
              a.name === "type" &&
              !["module", "text/javascript"].includes(a.value),
          )
        )
          js(text, f.path,loc?.startTag?.endLine,loc?.startTag?.endCol);
        if (node.tagName === "style") css(text, f.path);
        for (const c of node.childNodes || []) visit(c);
      };
      visit(parse(source,{sourceCodeLocationInfo:true}));
      if (/\.html?$/i.test(f.path)) {
        try {
          findings.push(...inspectAccessibility(source, f.path));
        } catch {
          accessibility = "unavailable";
          findings.push({
            rule: "a11y.unavailable",
            severity: "warning",
            group: "accessibility",
            file: f.path,
            location: "Belge",
            evidence: "",
            message: "Statik erişilebilirlik incelemesi tamamlanamadı.",
            remedy: "Yönetici manuel erişilebilirlik incelemesi yapmalı.",
          });
        }
      }
    }
  }
  if (findings.length > 2000) {
    const count = findings.length;
    findings.splice(2000);
    findings.push({
      rule: "coverage.truncated",
      severity: "warning",
      group: "coverage",
      file: "Paket",
      location: "Rapor",
      evidence: "",
      message: `${count} bulgunun ilk 2000 örneği gösteriliyor.`,
      remedy:
        "Tekrarlanan sorunları düzeltin veya bütün dosyaları manuel inceleyin.",
    });
  }
  let tracking = false;
  if (files.has("manifest.json")) {
    const trackingManifest = JSON.parse(
      await readFile(path.join(root, "manifest.json"), "utf8"),
    );
    if (
      trackingManifest.tracking !== undefined &&
      trackingManifest.tracking !== 1
    )
      throw new BundleError("Desteklenmeyen takip protokolü.");
    tracking = trackingManifest.tracking === 1;
  }
  return {
    entrypoint: entrypoint || null,
    candidates,
    findings,
    accessibility,
    tracking,
  };
}
