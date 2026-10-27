import { it, expect } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { extractBundle, validateSources } from "../src/modules/bundle";
import { checkpointInput, parsed } from "../src/modules/learning";
import { assignmentStatus } from "../src/lib/learning-display";
for (const type of ["choice", "match", "order", "sort"]) {
  it(`${type} pilot has a local SDK, serializable state and valid package resources`, async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "learning-pilot-"));
    try {
      const manifest = await extractBundle(
        `fixtures/learning/${type}.zip`,
        "zip",
        dir,
      );
      const result = await validateSources(dir, manifest);
      expect(result.tracking).toBe(true);
      expect(result.entrypoint).toBe("index.html");
      expect(manifest.some((f) => f.path === "dijital-atolye.js")).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
}
it("unknown metrics remain unknown and opening unsupported games never implies completion", () => {
  expect(assignmentStatus({ tracking: false, started: true })).toBe(
    "Açıldı · Tamamlanma ölçülemiyor",
  );
  expect(
    assignmentStatus({
      tracking: true,
      started: true,
      due_at: "2020-01-01T00:00:00Z",
    }),
  ).toBe("Devam ediyor · Gecikmiş");
  expect(
    assignmentStatus({
      tracking: true,
      completed: true,
      due_at: "2020-01-01T00:00:00Z",
    }),
  ).toBe("Tamamlandı");
  expect(
    assignmentStatus({ tracking: true, completed: true, closed: true }),
  ).toBe("Tamamlandı · Kapalı");
});
it("checkpoint validation rejects invalid revisions, metrics and missing state", () => {
  const body = {
    requestId: crypto.randomUUID(),
    revision: 0,
    state: { round: 1 },
  };
  expect(parsed(checkpointInput, body)).toMatchObject({ complete: false });
  for (const value of [
    { ...body, score: NaN },
    { ...body, progress: 101 },
    { ...body, revision: -1 },
    { ...body, state: undefined },
  ])
    expect(() => parsed(checkpointInput, value)).toThrow();
});
