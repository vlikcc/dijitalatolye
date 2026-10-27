import { createHash } from "node:crypto";
import { readFile, mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { filePath, hashFile } from "./storage";
import { safePath } from "./bundle";
import { gameInfoSchema } from "./metadata-extract";
import { clamScan, yaraScan } from "./scanner";
import {
  COVER_RENDERER_VERSION,
  type CoverSelection,
  type CoverArtifact,
} from "./review-types";
import type { Metadata, FileRecord } from "../server/schema";

export function coverMetadataKey(metadata: Partial<Metadata>) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        metadata.title ?? "",
        metadata.subjectId ?? "",
        metadata.grade ?? 0,
      ]),
    )
    .digest("hex");
}
export function coverCandidates(manifest: FileRecord[]) {
  return manifest
    .filter(
      (f) => /\.(png|jpe?g|webp)$/i.test(f.path) && f.size <= 5 * 1024 * 1024,
    )
    .map((f) => f.path);
}
export async function automaticCover(
  root: string,
  manifest: FileRecord[],
): Promise<{ selection: CoverSelection; warning?: string }> {
  const info = manifest.find((f) => f.path === "dijitalatolye.json");
  let warning: string | undefined;
  if (info && info.size <= 1024 * 1024) {
    try {
      const parsed = gameInfoSchema.safeParse(
        JSON.parse(await readFile(path.join(root, info.path), "utf8")),
      );
      if (
        parsed.success &&
        parsed.data.schemaVersion === 2 &&
        parsed.data.cover
      ) {
        const p = safePath(parsed.data.cover.path);
        if (!coverCandidates(manifest).includes(p)) throw Error();
        return { selection: { mode: "package", path: p } };
      }
      if (!parsed.success)
        warning =
          "Oyun bilgi manifesti okunamadı; kapak adaylarını kontrol edin.";
    } catch {
      warning =
        "Manifestteki kapak bulunamadı veya geçersiz; otomatik kapak kullanılacak.";
    }
  }
  if (warning) return { selection: { mode: "generated" }, warning };
  const roots = coverCandidates(manifest).filter((p) =>
    /^cover\.(png|jpe?g|webp)$/i.test(p),
  );
  if (roots.length === 1)
    return { selection: { mode: "package", path: roots[0] } };
  return {
    selection: { mode: "generated" },
    warning:
      roots.length > 1
        ? "Birden fazla kapak adayı var. Birini seçebilir veya otomatik kapağı kullanabilirsiniz."
        : undefined,
  };
}
const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
export function subjectPalette(subject: string) {
  const s = subject.toLocaleLowerCase("tr");
  if (s.includes("matematik"))
    return {
      ink: "#7046d3",
      paper: "#eee7fc",
      icon: '<path d="M24 44h40M44 24v40M90 32h40m-40 24h40"/>',
    };
  if (s.includes("türkçe") || s.includes("edebiyat"))
    return {
      ink: "#a7464d",
      paper: "#fce9e7",
      icon: '<path d="M24 24h42c8 0 14 6 14 14v76c0-8-6-14-14-14H24zm112 0H94c-8 0-14 6-14 14v76c0-8 6-14 14-14h42z"/>',
    };
  if (/fen|fizik|kimya|biyoloji/.test(s))
    return {
      ink: "#0b7471",
      paper: "#dff2ed",
      icon: '<path d="M60 24h40M68 24v36l-30 52c-4 8 0 14 9 14h66c9 0 13-6 9-14L92 60V24M53 86h54"/>',
    };
  if (/hayat|sosyal|tarih|coğrafya/.test(s))
    return {
      ink: "#865b18",
      paper: "#fcf0d8",
      icon: '<circle cx="80" cy="78" r="52"/><path d="M28 78h104M80 26c-30 30-30 74 0 104 30-30 30-74 0-104z"/>',
    };
  return {
    ink: "#18213d",
    paper: "#eeedf3",
    icon: '<path d="M30 30h100v100H30zM30 80h100M80 30v100"/>',
  };
}
async function generated(metadata: Partial<Metadata>, subject: string) {
  const palette = subjectPalette(subject);
  const font = path.resolve("assets/fonts/Manrope.ttf");
  const labelFont = path.resolve("assets/fonts/SourceSans3.ttf");
  const title = await sharp({
    text: {
      text: `<span foreground="#18213d">${escape(metadata.title?.trim() || "Yeni oyun")}</span>`,
      font: "Manrope Bold 92",
      fontfile: font,
      width: 1080,
      rgba: true,
      dpi: 72,
      wrap: "word-char",
    },
  })
    .resize({
      width: 1080,
      height: 320,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();
  const label = await sharp({
    text: {
      text: escape(
        `${subject || "Ders seçilmedi"}${metadata.grade ? ` · ${metadata.grade}. sınıf` : ""}`,
      ),
      font: "Source Sans 3 SemiBold 34",
      fontfile: labelFont,
      width: 1080,
      rgba: true,
    },
  })
    .resize({
      width: 1080,
      height: 66,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();
  const icon = Buffer.from(
    `<svg width="160" height="160" xmlns="http://www.w3.org/2000/svg"><g stroke="${palette.ink}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none">${palette.icon}</g></svg>`,
  );
  return sharp({
    create: {
      width: 1440,
      height: 880,
      channels: 3,
      background: palette.paper,
    },
  })
    .composite([
      { input: icon, left: 82, top: 68 },
      { input: title, left: 100, top: 320 },
      { input: label, left: 100, top: 740 },
    ])
    .png()
    .toBuffer();
}
export async function normalizeCover(input: Buffer, background: string) {
  if (input.byteLength > 5 * 1024 * 1024)
    throw Error("Görsel 5 MB sınırını aşıyor.");
  const image = sharp(input, {
    limitInputPixels: 20_000_000,
    failOn: "warning",
  });
  const info = await image.metadata().catch(()=>{throw Error("Görsel okunamadı. Dosya bozuk veya 20 milyon piksel sınırını aşıyor.");});
  if (!["png", "jpeg", "webp"].includes(info.format ?? ""))
    throw Error(
      "PNG, JPG veya WebP seçin; dosyanın gerçek biçimi desteklenmiyor.",
    );
  if ((info.pages ?? 1) > 1)
    throw Error("Hareketli veya çok kareli görsel desteklenmiyor.");
  return image
    .autoOrient()
    .flatten({ background })
    .resize(1440, 880, { fit: "contain", background, withoutEnlargement: true })
    .webp({ quality: 85 })
    .timeout({ seconds: 15 })
    .toBuffer().catch(()=>{throw Error("Görsel yeniden kodlanamadı. Farklı bir PNG, JPG veya WebP yükleyin.");});
}
export async function renderCover(input: {
  versionId: string;
  selection: CoverSelection;
  manifest: FileRecord[];
  metadata: Partial<Metadata>;
  metadataRevision: number;
  subject: string;
}): Promise<{ artifact: CoverArtifact; warning?: string }> {
  const root = filePath("ready", input.versionId);
  const automatic = input.selection.mode === "auto";
  const resolved = automatic
    ? await automaticCover(root, input.manifest)
    : { selection: input.selection, warning: undefined };
  let selection = resolved.selection;
  let warning = resolved.warning;
  let pixels: Buffer;
  let sourceHash: string;
  try {
    if (selection.mode === "upload") {
      const dir = filePath("cover-inputs", selection.inputId);
      const file = path.join(dir, "input");
      if ((await hashFile(file)) !== selection.sha256)
        throw Error("Kapak bütünlüğü doğrulanamadı.");
      await clamScan(file);
      await yaraScan(dir);
      pixels = await normalizeCover(
        await readFile(file),
        subjectPalette(input.subject).paper,
      );
      sourceHash = selection.sha256;
    } else if (selection.mode === "package") {
      const p = safePath(selection.path);
      const f = input.manifest.find((f) => f.path === p);
      if (!f || !coverCandidates(input.manifest).includes(p))
        throw Error("Kapak pakette bulunamadı veya boyutu desteklenmiyor.");
      const file = path.join(root, p);
      if ((await hashFile(file)) !== f.sha256)
        throw Error("Paket kapağının bütünlüğü doğrulanamadı.");
      pixels = await normalizeCover(
        await readFile(file),
        subjectPalette(input.subject).paper,
      );
      sourceHash = f.sha256;
    } else {
      selection = { mode: "generated" };
      pixels = await generated(input.metadata, input.subject);
      sourceHash = coverMetadataKey(input.metadata);
    }
  } catch (e) {
    if (!automatic || selection.mode !== "package") throw e;
    warning = `Paket kapağı kullanılamadı: ${e instanceof Error ? e.message : "Geçersiz görsel."} Otomatik kapak hazırlandı.`;
    selection = { mode: "generated" };
    pixels = await generated(input.metadata, input.subject);
    sourceHash = coverMetadataKey(input.metadata);
  }
  const id = crypto.randomUUID();
  // Keep both paths on the thumbnails volume; cross-volume rename is not atomic.
  const temp = filePath("thumbnails", `.tmp-${id}`),
    dest = filePath("thumbnails", id);
  await mkdir(temp, { recursive: true });
  try {
    await sharp(pixels)
      .resize(1440, 880, {
        fit: "contain",
        background: subjectPalette(input.subject).paper,
      })
      .webp({ quality: 85 })
      .toFile(path.join(temp, "large.webp"));
    await sharp(pixels)
      .resize(720, 440, {
        fit: "contain",
        background: subjectPalette(input.subject).paper,
      })
      .webp({ quality: 85 })
      .toFile(path.join(temp, "small.webp"));
    const artifact: CoverArtifact = {
      id,
      source: selection.mode as CoverArtifact["source"],
      sourcePath: selection.mode === "package" ? selection.path : undefined,
      sourceHash,
      rendererVersion: COVER_RENDERER_VERSION,
      metadataRevision: input.metadataRevision,
      metadataKey: coverMetadataKey(input.metadata),
      smallHash: await hashFile(path.join(temp, "small.webp")),
      largeHash: await hashFile(path.join(temp, "large.webp")),
    };
    await rename(temp, dest);
    return { artifact, warning };
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
export async function verifyCover(artifact: CoverArtifact) {
  for (const [size, hash] of [
    ["small", artifact.smallHash],
    ["large", artifact.largeHash],
  ])
    if (
      (await hashFile(
        filePath("thumbnails", `${artifact.id}/${size}.webp`),
      )) !== hash
    )
      throw Error("Kapak dosyası bütünlüğü doğrulanamadı.");
}
