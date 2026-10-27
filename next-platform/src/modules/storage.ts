import path from "node:path";
import { mkdir, copyFile, rename, rm, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { settings } from "../server/env";
import type { FileRecord } from "../server/schema";
export const filePath = (
  area: "quarantine" | "ready" | "published" | "work" | "thumbnails" | "cover-inputs",
  id: string,
) => path.join(settings().dataDir, area, id);
export async function initStorage() {
  for (const dir of ["quarantine", "ready", "published", "work", "thumbnails", "cover-inputs"])
    await mkdir(path.join(settings().dataDir, dir), { recursive: true });
}
export async function hashFile(file: string) {
  const h = createHash("sha256");
  for await (const chunk of createReadStream(file)) h.update(chunk);
  return h.digest("hex");
}
export async function verifyManifest(root: string, manifest: FileRecord[]) {
  for (const file of manifest) {
    const p = path.join(root, file.path);
    if (
      (await stat(p)).size !== file.size ||
      (await hashFile(p)) !== file.sha256
    )
      throw new Error("Dosya bütünlüğü doğrulanamadı.");
  }
}
export async function preparePublication(id: string, manifest: FileRecord[]) {
  const source = filePath("ready", id),
    dest = filePath("published", id);
  try {
    await verifyManifest(dest, manifest);
    return;
  } catch {}
  const temp = filePath("published", `.tmp-${id}-${crypto.randomUUID()}`);
  await mkdir(temp, { recursive: true });
  try {
    await verifyManifest(source, manifest);
    for (const f of manifest) {
      await mkdir(path.dirname(path.join(temp, f.path)), { recursive: true });
      await copyFile(path.join(source, f.path), path.join(temp, f.path));
    }
    await verifyManifest(temp, manifest);
    await rm(dest, { recursive: true, force: true });
    await rename(temp, dest);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
