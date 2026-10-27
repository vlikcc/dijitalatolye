import { beforeAll, afterAll, it, expect } from "vitest";
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import sharp from "sharp";
import { eq } from "drizzle-orm";
import { db, pool, transaction } from "../../src/server/db";
import { versions, user, taxonomy, contents } from "../../src/server/schema";
import {
  createContent,
  addVersion,
  saveMetadata,
  decide,
} from "../../src/modules/content";
import { selectCover } from "../../src/modules/cover-actions";
import { initStorage, filePath, hashFile } from "../../src/modules/storage";
import { processJob } from "../../src/worker/pipeline";
import { boss } from "../../src/server/queue";
import { testAssessment, decideForTest } from "../helpers/review";
let uid: string, subjectId: string;
const get = async (id: string) =>
  (await db.query.versions.findFirst({ where: eq(versions.id, id) }))!;
beforeAll(async () => {
  if (!new URL(process.env.DATABASE_URL!).pathname.endsWith("_test"))
    throw Error("Dedicated test database required");
  await initStorage();
  uid = crypto.randomUUID();
  await db
    .insert(user)
    .values({
      id: uid,
      name: "Cover Test",
      email: uid + "@test.invalid",
      emailVerified: true,
    });
  subjectId = (
    await db
      .insert(taxonomy)
      .values({ kind: "subject", label: "Matematik cover " + uid })
      .returning()
  )[0].id;
});
afterAll(async () => {
  await (await boss()).stop();
  await pool.end();
});
async function upload(contentId?: string) {
  const c = contentId
    ? (await db.query.contents.findFirst({
        where: eq(contents.id, contentId),
      }))!
    : await createContent(uid);
  const id = crypto.randomUUID();
  await writeFile(
    filePath("quarantine", id),
    '<html lang="tr"><title>Oyun</title><canvas></canvas><h1>Şaşırtıcı Işık ve Ölçüm Oyunu</h1></html>',
  );
  const sha = await hashFile(filePath("quarantine", id));
  const metadata = {
    title: "Şaşırtıcı Işık ve Ölçüm Oyunu <b>HTML değil</b>",
    description: "Test oyununun öğretmen tarafından yazılan açıklaması.",
    grade: 4,
    subjectId,
    outcomeIds: [],
  };
  await addVersion(c.id, uid, id, sha, "html", metadata);
  await processJob("scan", { versionId: id, sha256: sha });
  await processJob("extract-metadata", { versionId: id, sha256: sha });
  return { id, sha, c, metadata };
}
const render = async (id: string) => {
  const v = await get(id);
  await processJob("render-cover", {
    versionId: id,
    sha256: v.sha256,
    coverRevision: v.cover!.revision,
  });
  return get(id);
};
it("generates real raster covers, requires editorial evidence, freezes submitted cover and rejects stale report identity", async () => {
  const x = await upload();
  let v = await get(x.id);
  expect(
    v.technicalReport?.findings.some((f) => f.rule === "a11y.canvas"),
  ).toBe(true);
  await expect(
    saveMetadata(x.id, uid, x.sha, 0, x.metadata, true),
  ).rejects.toThrow(/kapak/);
  v = await render(x.id);
  expect(v.cover?.status).toBe("ready");
  const artifact = v.cover!.artifact!;
  expect(
    await sharp(
      await readFile(filePath("thumbnails", artifact.id + "/large.webp")),
    ).metadata(),
  ).toMatchObject({ width: 1440, height: 880, format: "webp" });
  expect(
    await sharp(
      await readFile(filePath("thumbnails", artifact.id + "/small.webp")),
    ).metadata(),
  ).toMatchObject({ width: 720, height: 440 });
  await processJob("render-cover", {
    versionId: x.id,
    sha256: x.sha,
    coverRevision: v.cover!.revision,
  });
  expect((await get(x.id)).cover!.artifact!.id).toBe(artifact.id);
  await saveMetadata(x.id, uid, x.sha, 0, x.metadata, true);
  v = await get(x.id);
  await expect(
    selectCover(x.id, uid, x.sha, v.metadataRevision, v.cover!.revision, {
      mode: "generated",
    }),
  ).rejects.toThrow(/değişti/);
  await expect(
    decide(x.id, x.sha, uid, "approve", "Missing form", v.metadataRevision),
  ).rejects.toThrow(/rapor/);
  const review = {
    technicalReportId: v.technicalReport!.id,
    coverId: artifact.id,
    assessment: testAssessment(v.technicalReport!),
  };
  await expect(
    decide(
      x.id,
      x.sha,
      uid,
      "approve",
      "Wrong report",
      v.metadataRevision,
      [],
      { ...review, technicalReportId: "stale" },
    ),
  ).rejects.toThrow(/değişti/);
  await expect(
    decide(
      x.id,
      x.sha,
      uid,
      "approve",
      "Missing warning",
      v.metadataRevision,
      [],
      { ...review, assessment: { ...review.assessment, warnings: [] } },
    ),
  ).rejects.toThrow(/uyarı/);
  await decide(
    x.id,
    x.sha,
    uid,
    "approve",
    "TEST ONLY: reviewed",
    v.metadataRevision,
    [],
    review,
  );
  await processJob("publish", { versionId: x.id, sha256: x.sha });
  expect(
    (await db.query.contents.findFirst({ where: eq(contents.id, x.c.id) }))!
      .publishedVersionId,
  ).toBe(x.id);
});
it("rejects another teacher and stale cover jobs, preserves last output while a chosen invalid upload fails", async () => {
  const x = await upload();
  let v = await render(x.id);
  const old = v.cover!.artifact!.id,
    oldRevision = v.cover!.revision;
  await expect(
    selectCover(x.id, "other", x.sha, 0, oldRevision, { mode: "generated" }),
  ).rejects.toThrow(/sahibi/);
  await saveMetadata(x.id, uid, x.sha, 0, {
    ...x.metadata,
    title: "Yeni başlık",
  });
  v = await get(x.id);
  await processJob("render-cover", {
    versionId: x.id,
    sha256: x.sha,
    coverRevision: oldRevision,
  });
  expect((await get(x.id)).cover!.status).toBe("pending");
  v = await render(x.id);
  expect(v.cover!.artifact!.id).not.toBe(old);
  const inputId = crypto.randomUUID();
  await mkdir(filePath("cover-inputs", inputId));
  await writeFile(
    filePath("cover-inputs", inputId + "/input"),
    "<script>not an image</script>",
  );
  await selectCover(x.id, uid, x.sha, v.metadataRevision, v.cover!.revision, {
    mode: "upload",
    inputId,
    sha256: await hashFile(filePath("cover-inputs", inputId + "/input")),
  });
  await expect(render(x.id)).rejects.toThrow();
  const failed = await get(x.id);
  expect(failed.cover!.status).toBe("error");
  expect(failed.cover!.artifact!.id).toBe(v.cover!.artifact!.id);
  await expect(
    saveMetadata(
      x.id,
      uid,
      x.sha,
      failed.metadataRevision,
      failed.draftMetadata,
      true,
    ),
  ).rejects.toThrow(/kapak/);
  await selectCover(
    x.id,
    uid,
    x.sha,
    failed.metadataRevision,
    failed.cover!.revision,
    { mode: "generated" },
  );
  expect((await render(x.id)).cover!.status).toBe("ready");
});
it("rolls back a cover selection when the transaction's queue insert fails", async () => {
  const x = await upload();
  const before = await get(x.id);
  // Fail the actual queue write inside the transaction, then verify both records.
  await pool.query(
    "CREATE OR REPLACE FUNCTION public.fail_cover_job_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.name='render-cover' THEN RAISE EXCEPTION 'test queue failure'; END IF; RETURN NEW; END $$",
  );
  await pool.query(
    "CREATE TRIGGER fail_cover_job_test BEFORE INSERT ON pgboss.job FOR EACH ROW EXECUTE FUNCTION public.fail_cover_job_test()",
  );
  try {
    await expect(
      selectCover(x.id, uid, x.sha, 0, before.cover!.revision, {
        mode: "generated",
      }),
    ).rejects.toThrow();
    expect((await get(x.id)).cover).toEqual(before.cover);
  } finally {
    await pool.query("DROP TRIGGER fail_cover_job_test ON pgboss.job");
    await pool.query("DROP FUNCTION public.fail_cover_job_test()");
  }
});
it("keeps the prior publication when a new version's cover disappears before publication", async () => {
  const first = await upload();
  await render(first.id);
  await saveMetadata(first.id, uid, first.sha, 0, first.metadata, true);
  await decideForTest(first.id, first.sha, uid, "approve", "TEST ONLY: first");
  await processJob("publish", { versionId: first.id, sha256: first.sha });
  const next = await upload(first.c.id);
  const v = await render(next.id);
  await saveMetadata(next.id, uid, next.sha, 0, next.metadata, true);
  await decideForTest(next.id, next.sha, uid, "approve", "TEST ONLY: second");
  await rm(filePath("thumbnails", v.cover!.artifact!.id), { recursive: true });
  await expect(
    processJob("publish", { versionId: next.id, sha256: next.sha }),
  ).rejects.toThrow();
  expect((await get(next.id)).state).toBe("publish_error");
  expect(
    (await db.query.contents.findFirst({ where: eq(contents.id, first.c.id) }))!
      .publishedVersionId,
  ).toBe(first.id);
});
