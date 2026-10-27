import { it, expect, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { extractMetadata } from "../src/modules/metadata-extract";
import { runExtraction } from "../src/modules/extraction-runner";
import { searchWords } from "../src/modules/curriculum";
import { officialSourceUrl } from "../src/modules/curriculum-source";
const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});
async function input(files: Record<string, string>) {
  const root = await mkdtemp(path.join(os.tmpdir(), "metadata-"));
  roots.push(root);
  const manifest = [];
  for (const [name, text] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await writeFile(path.join(root, name), text);
    manifest.push({
      path: name,
      size: Buffer.byteLength(text),
      sha256: createHash("sha256").update(text).digest("hex"),
    });
  }
  return {
    root,
    manifest,
    entrypoint: "index.html",
    versionId: crypto.randomUUID(),
    sha256: "a".repeat(64),
    catalogId: null,
    originalFilename: "kesir-oyunu.zip",
  };
}
it("reads manifest, DOM, local JSON and module literals with evidence without executing scripts", async () => {
  const i = await input({
    "index.html":
      '<title>HTML adı</title><meta name="description" content="Kesirleri birlikte keşfedelim."><h1>Kesir mutfağı</h1><script type="module" src="game.js"></script>',
    "dijitalatolye.json": JSON.stringify({
      schemaVersion: 1,
      title: "Kesir oyunu",
      grade: 4,
      subject: "Matematik",
      outcomeCodes: ["MAT.4.1.1."],
    }),
    "game.js":
      'import "./questions.js"; fetch("./data.json"); globalThis.executed = true; throw new Error("must not execute");',
    "questions.js":
      'export const prompt="Bir bütünün yarım ve çeyrek parçalarını bul.";',
    "data.json": JSON.stringify({
      question: "Çeyrek kesirler nasıl gösterilir?",
    }),
  });
  const r = await extractMetadata(i);
  expect(r.fields.title?.value).toBe("Kesir oyunu");
  expect(r.fields.description?.evidence.file).toBe("index.html");
  expect(r.fields.grade?.value).toBe(4);
  expect(r.codes[0].code).toBe("MAT.4.1.1.");
  expect(r.passages.some((p) => p.file === "data.json")).toBe(true);
  expect(r.passages.some((p) => p.file === "questions.js")).toBe(true);
  expect((globalThis as any).executed).toBeUndefined();
});
it("handles missing semantic data and malformed optional manifest without inventing a description", async () => {
  const r = await extractMetadata(
    await input({
      "index.html": "<canvas></canvas>",
      "dijitalatolye.json": "{",
    }),
  );
  expect(r.fields.title?.value).toBe("kesir oyunu");
  expect(r.fields.description).toBeUndefined();
  expect(r.fields.grade).toBeUndefined();
  expect(r.status).toBe("partial");
});
it("reports truncation and omits library text", async () => {
  const r = await extractMetadata(
    await input({
      "index.html":
        '<script src="lib/library.js"></script><script src="huge.js"></script>',
      "lib/library.js": 'const answer="özel gizli kavram";',
      "huge.js": "/*" + "x".repeat(1024 * 1024) + "*/",
    }),
  );
  expect(r.warnings.some((w) => w.includes("kütüphane"))).toBe(true);
  expect(r.warnings.some((w) => w.includes("kesildi"))).toBe(true);
  expect(r.passages.some((p) => p.text.includes("gizli"))).toBe(false);
});
it("runs the static parser in its bounded child process", async () => {
  const r = await runExtraction(
    await input({ "index.html": "<h1>İşık ve gölge</h1>" }),
  );
  expect(r.fields.title?.value).toBe("İşık ve gölge");
});
it("keeps Turkish characters and excludes generic educational vocabulary", () => {
  expect(
    searchWords("OYUN Öğrenci öğrenme başla IŞIK ışık ŞEKİL şekil"),
  ).toEqual(["ışık", "şekil"]);
});
it("restricts source downloads to official hosts without credentials or arbitrary ports", () => {
  for (const u of [
    "https://evil.test/meb.gov.tr",
    "https://meb.gov.tr.evil.test/a",
    "https://user@meb.gov.tr/a",
    "http://127.0.0.1/a",
    "https://meb.gov.tr:8443/a",
  ])
    expect(() => officialSourceUrl(u)).toThrow();
  expect(officialSourceUrl("http://tymm.meb.gov.tr/a.pdf").protocol).toBe(
    "https:",
  );
});
