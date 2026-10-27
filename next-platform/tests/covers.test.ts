import { it, expect, afterAll } from "vitest";
import sharp from "sharp";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  automaticCover,
  normalizeCover,
  coverMetadataKey,
} from "../src/modules/covers";
import { gameInfoSchema } from "../src/modules/metadata-extract";
const dirs: string[] = [];
afterAll(async () => {
  for (const d of dirs) await rm(d, { recursive: true, force: true });
});
const records = (names: string[]) =>
  names.map((path) => ({ path, size: 100, sha256: "hash" }));
it("accepts v1 and v2 metadata while preserving cover's package-relative declaration", () => {
  expect(
    gameInfoSchema.safeParse({ schemaVersion: 1, title: "Oyun" }).success,
  ).toBe(true);
  expect(
    gameInfoSchema.parse({
      schemaVersion: 2,
      title: "Oyun",
      cover: { path: "images/kapak.png" },
    }),
  ).toHaveProperty("cover.path", "images/kapak.png");
  expect(gameInfoSchema.safeParse({ schemaVersion: 3 }).success).toBe(false);
});
it("prefers declared cover, accepts one conventional root cover, does not guess among several", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "cover-test-"));
  dirs.push(root);
  expect(
    (await automaticCover(root, records(["cover.png"]))).selection,
  ).toEqual({ mode: "package", path: "cover.png" });
  expect(
    (await automaticCover(root, records(["cover.png", "cover.jpg"]))).selection,
  ).toEqual({ mode: "generated" });
  await writeFile(
    path.join(root, "dijitalatolye.json"),
    JSON.stringify({ schemaVersion: 2, cover: { path: "img/custom.png" } }),
  );
  expect(
    (
      await automaticCover(
        root,
        records(["dijitalatolye.json", "cover.png", "img/custom.png"]),
      )
    ).selection,
  ).toEqual({ mode: "package", path: "img/custom.png" });
  await writeFile(
    path.join(root, "dijitalatolye.json"),
    JSON.stringify({ schemaVersion: 2, cover: { path: "../cover.png" } }),
  );
  expect(
    (await automaticCover(root, records(["dijitalatolye.json", "cover.png"])))
      .warning,
  ).toMatch(/geçersiz/);
});
it("reencodes with orientation, strips metadata and rejects SVG, oversized and animated input", async () => {
  const input = await sharp({
    create: { width: 160, height: 90, channels: 3, background: "#7046d3" },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
  const output = await normalizeCover(input, "#eee7fc");
  const info = await sharp(output).metadata();
  expect(info.format).toBe("webp");
  expect(info.exif).toBeUndefined();
  expect(info.orientation).toBeUndefined();
  await expect(
    normalizeCover(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
      ),
      "white",
    ),
  ).rejects.toThrow(/gerçek biçimi/);
  await expect(
    normalizeCover(Buffer.alloc(5 * 1024 * 1024 + 1), "white"),
  ).rejects.toThrow(/5 MB/);
  const giant = await sharp({
    create: { width: 5000, height: 5000, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  await expect(normalizeCover(giant, "white")).rejects.toThrow(/piksel/i);
  const animated = Buffer.from([
    255, 0, 0, 255, 0, 0, 255, 0, 0, 255, 0, 0, 0, 0, 255, 0, 0, 255, 0, 0, 255,
    0, 0, 255,
  ]);
  const multi = await sharp(animated, {
    raw: { width: 2, height: 4, channels: 3, pageHeight: 2 },
  })
    .webp({ loop: 0, delay: [100, 100] })
    .toBuffer();
  expect((await sharp(multi).metadata()).pages).toBe(2);
  await expect(normalizeCover(multi, "white")).rejects.toThrow(/kareli/);
});
it("tracks only rendered metadata fields in cover identity", () => {
  expect(coverMetadataKey({ title: "Işığın keşfi", grade: 4 })).not.toBe(
    coverMetadataKey({ title: "Işığın keşfi", grade: 5 }),
  );
  expect(coverMetadataKey({ title: "A", description: "first" })).toBe(
    coverMetadataKey({ title: "A", description: "second" }),
  );
});
