import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ZipFile } from "yazl";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import {
  safePath,
  extractBundle,
  validateSources,
  limits,
  checkReference,
} from "../src/modules/bundle";
const dirs: string[] = [];
const original = { ...limits };
afterEach(async () => {
  Object.assign(limits, original);
  await Promise.all(
    dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })),
  );
});
async function zip(files: { name: string; value: string; mode?: number }[]) {
  const root = await mkdtemp(path.join(os.tmpdir(), "bundle-"));
  dirs.push(root);
  const file = path.join(root, "test.zip");
  const z = new ZipFile();
  for (const f of files)
    z.addBuffer(Buffer.from(f.value), f.name, { mode: f.mode });
  z.end();
  await pipeline(z.outputStream, createWriteStream(file));
  return { root, file, out: path.join(root, "out") };
}
describe("untrusted bundles", () => {
  it.each([
    "../bad",
    "/root",
    "a/../b",
    "a\\b",
    "a//b",
    "a%2fb",
    "a?b",
    "C:bad",
  ])("rejects unsafe path %s", (p) => expect(() => safePath(p)).toThrow());
  it("extracts a wrapped multi-file module game with local fetch", async () => {
    const f = await zip([
      {
        name: "game/index.html",
        value: '<script type="module" src="main.js"></script>',
      },
      {
        name: "game/main.js",
        value: "import './helper.js'; fetch('data.json').then(r=>r.json());",
      },
      { name: "game/helper.js", value: "export const value=1;" },
      { name: "game/data.json", value: "{}" },
    ]);
    const m = await extractBundle(f.file, "zip", f.out);
    expect(m.map((f) => f.path)).toContain("index.html");
    expect((await validateSources(f.out, m)).entrypoint).toBe("index.html");
  });
  it("rejects case collisions", async () => {
    const f = await zip([
      { name: "A.js", value: "" },
      { name: "a.js", value: "" },
    ]);
    await expect(extractBundle(f.file, "zip", f.out)).rejects.toThrow(/çakış/);
  });
  it("rejects symlinks", async () => {
    const f = await zip([
      { name: "link.txt", value: "/etc/passwd", mode: 0o120777 },
    ]);
    await expect(extractBundle(f.file, "zip", f.out)).rejects.toThrow(
      /Sembolik/,
    );
  });
  it("enforces cumulative decompressed size", async () => {
    limits.expanded = 1000;
    const f = await zip([
      { name: "a.txt", value: "x".repeat(600) },
      { name: "b.txt", value: "x".repeat(600) },
    ]);
    await expect(extractBundle(f.file, "zip", f.out)).rejects.toThrow(/limit/);
  });
  it("rejects excess entry count", async () => {
    limits.files = 1;
    const f = await zip([
      { name: "a.txt", value: "a" },
      { name: "b.txt", value: "b" },
    ]);
    await expect(extractBundle(f.file, "zip", f.out)).rejects.toThrow(
      /girdiyi/,
    );
  });
  it("rejects nested archives", async () => {
    const f = await zip([{ name: "nested.zip", value: "x" }]);
    await expect(extractBundle(f.file, "zip", f.out)).rejects.toThrow(
      /dosya türü/,
    );
  });
  it("requires correct Linux resource case", () =>
    expect(() =>
      checkReference("Main.js", "index.html", new Set(["main.js"])),
    ).toThrow(/Kaynak/));
  it.each([
    "https://cdn.example/game.js",
    "//cdn.example/a",
    "/assets/a.js",
    "javascript:alert(1)",
  ])("rejects remote/root resource %s", (p) =>
    expect(() => checkReference(p, "index.html", new Set())).toThrow(),
  );
  it("returns explicit entry candidates rather than guessing", async () => {
    const f = await zip([
      { name: "one.html", value: "<p>one</p>" },
      { name: "two.html", value: "<p>two</p>" },
    ]);
    const m = await extractBundle(f.file, "zip", f.out);
    const v = await validateSources(f.out, m);
    expect(v.entrypoint).toBeNull();
    expect(v.candidates).toHaveLength(2);
  });
  it("rejects runtime external fetch", async () => {
    const f = await zip([
      {
        name: "index.html",
        value: '<script>fetch("https://example.org/x")</script>',
      },
    ]);
    const m = await extractBundle(f.file, "zip", f.out);
    await expect(validateSources(f.out, m)).rejects.toThrow(/Harici/);
  });
});
