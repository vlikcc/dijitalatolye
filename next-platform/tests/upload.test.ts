import { it, expect, afterEach, vi } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { receiveUpload } from "../src/modules/upload";
const dirs: string[] = [];
afterEach(async () => {
  vi.unstubAllEnvs();
  for (const dir of dirs.splice(0))
    await rm(dir, { recursive: true, force: true });
});
async function request(files = 1) {
  const root = await mkdtemp(path.join(os.tmpdir(), "upload-"));
  dirs.push(root);
  vi.stubEnv("DATA_DIR", root);
  for (const key of ["BETTER_AUTH_SECRET", "PREVIEW_SECRET", "INTERNAL_SECRET"])
    vi.stubEnv(key, "test-only-".repeat(5));
  const form = new FormData();
  form.set("metadata", JSON.stringify({ title: "Paket" }));
  for (let i = 0; i < files; i++)
    form.append(
      "archive",
      new File(["<h1>Oyun</h1>"], `game${i}.html`, { type: "text/html" }),
    );
  return {
    root,
    req: new Request("http://localhost/upload", { method: "POST", body: form }),
  };
}
it("accepts exactly metadata plus one streamed file", async () => {
  const { root, req } = await request();
  const result = await receiveUpload(req, "test-id");
  expect(result.format).toBe("html");
  expect(result.sha256).toHaveLength(64);
  expect(await readFile(path.join(root, "quarantine/test-id"), "utf8")).toBe(
    "<h1>Oyun</h1>",
  );
});
it("rejects a second file without accepting a partial package", async () => {
  const { req } = await request(2);
  await expect(receiveUpload(req, "test-id")).rejects.toThrow(/Tek oyun/);
});
