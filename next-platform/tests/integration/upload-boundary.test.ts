import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { receiveUpload } from "../../src/modules/upload";
import {
  MAX_PACKAGE_BYTES,
  validatePackageFiles,
} from "../../src/lib/package-file";
let storage: string;
const originalStorage = process.env.DATA_DIR;
beforeAll(async () => {
  storage = await mkdtemp(path.join(tmpdir(), "21st-upload-boundary-"));
  process.env.DATA_DIR = storage;
});
afterAll(async () => {
  if (originalStorage === undefined) delete process.env.DATA_DIR;
  else process.env.DATA_DIR = originalStorage;
  await rm(storage, { recursive: true, force: true });
});
describe("picker and existing multipart server agree at the size boundary", () => {
  it.each([MAX_PACKAGE_BYTES, MAX_PACKAGE_BYTES + 1, MAX_PACKAGE_BYTES + 2])(
    "checks %i bytes through the actual multipart parser",
    async (size) => {
      const file = new File([new Uint8Array(size)], "LIMIT.HTML", {
        type: "text/html",
      });
      const data = new FormData();
      data.set("archive", file);
      const result = receiveUpload(
        new Request("http://localhost/api/contents/test/versions", {
          method: "POST",
          body: data,
        }),
        crypto.randomUUID(),
      );
      if (validatePackageFiles([file]) === null)
        await expect(result).resolves.toBeDefined();
      else await expect(result).rejects.toThrow("50 MB");
    },
  );
});
