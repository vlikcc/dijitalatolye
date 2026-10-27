import {decideForTest as decide, prepareReviewFixture} from "../helpers/review";
import { beforeAll, afterAll, it, expect } from "vitest";
import { mkdtemp, cp, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { eq } from "drizzle-orm";
import {
  importCurriculum,
  inspectCurriculum,
  digest,
} from "../../src/modules/curriculum-import";
import {
  searchOutcomes,
  activeCatalog,
  validateCurriculumMetadata,
  reviewOutcome,
  selectedOutcomes,
} from "../../src/modules/curriculum";
import { db, pool } from "../../src/server/db";
import { user, curriculumPrograms, versions } from "../../src/server/schema";
import {
  createContent,
  addVersion,
  saveMetadata,
} from "../../src/modules/content";
import { boss } from "../../src/server/queue";
import { settings } from "../../src/server/env";
import type { ExtractionReport } from "../../src/modules/curriculum-types";
let root: string,
  catalogId: string,
  subjectId: string,
  uid: string,
  oid: string,
  sha = "a".repeat(64);
const programId = "program-mufredat-2024";
beforeAll(async () => {
  if (!new URL(process.env.DATABASE_URL!).pathname.endsWith("_test"))
    throw Error("Dedicated *_test database required.");
  root = await mkdtemp(path.join(os.tmpdir(), "curriculum-test-"));
  await cp("fixtures/curriculum-test", root, { recursive: true });
  catalogId = (await importCurriculum(root)).id;
  // The dedicated test DB may survive an earlier run. Verification is scoped
  // to this synthetic catalog and must start unreviewed in every run.
  await pool.query("DELETE FROM curriculum_reviews WHERE catalog_id=$1", [
    catalogId,
  ]);
  subjectId = (await db.query.curriculumPrograms.findFirst({
    where: eq(curriculumPrograms.catalogId, catalogId),
  }))!.subjectId!;
  uid = crypto.randomUUID();
  await db.insert(user).values({
    id: uid,
    email: uid + "@test.invalid",
    name: "Test editor",
    emailVerified: true,
    role: "editor",
    twoFactorEnabled: true,
  });
  oid = (
    await searchOutcomes({
      catalogId,
      programId,
      grade: 5,
      subjectId,
      q: "BTY.5.1.1",
    })
  ).items[0].id;
});
afterAll(async () => {
  await rm(root, { recursive: true, force: true });
  await (await boss()).stop();
  await pool.end();
});
const metadata = () => ({
  title: "Dijital vatandaşlık oyunu",
  description:
    "Günlük yaşamda kullanılan bilişim teknolojilerini sınıflandırın.",
  grade: 5,
  subjectId,
  outcomeIds: [],
  catalogId,
  programId,
  academicYear: "2026–2027",
  schoolType: "Ortaokul",
  outcomeRefs: [{ catalogId, outcomeId: oid }],
});
it("imports idempotently and never activates corrupt or incomplete input", async () => {
  const second = await importCurriculum(root);
  expect(second.id).toBe(catalogId);
  expect(
    Number(
      (
        await pool.query(
          "SELECT count(*) FROM curriculum_outcomes WHERE catalog_id=$1",
          [catalogId],
        )
      ).rows[0].count,
    ),
  ).toBe(2);
  const file = path.join(root, "programs.json"),
    original = await readFile(file);
  await writeFile(file, "{}");
  await expect(importCurriculum(root)).rejects.toThrow(/bütünlüğü/);
  expect((await activeCatalog())!.id).toBe(catalogId);
  await writeFile(file, original);
  const shard = path.join(root, "outcomes", programId, "grade-5.json"),
    bytes = await readFile(shard);
  await rm(shard);
  await expect(inspectCurriculum(root)).rejects.toThrow(/manifest/);
  await writeFile(shard, bytes);
});
it("requires a coherent grade/program, explains exact codes, and returns no generic or irrelevant suggestions", async () => {
  await expect(
    validateCurriculumMetadata({ ...metadata(), grade: 4 }),
  ).rejects.toThrow(/uyuşmuyor/);
  const report: ExtractionReport = {
    status: "complete",
    versionId: crypto.randomUUID(),
    sha256: sha,
    entrypoint: "index.html",
    extractorVersion: "1",
    catalogId,
    fields: {},
    codes: [
      {
        code: "BTY.5.1.1.",
        evidence: {
          file: "dijitalatolye.json",
          location: "/outcomeCodes",
          text: "BTY.5.1.1.",
        },
      },
    ],
    passages: [],
    warnings: [],
  };
  const exact = await searchOutcomes({
    catalogId,
    programId,
    subjectId,
    grade: 5,
    report,
  });
  expect(exact.items[0].reason).toBe("Pakette belirtilmiş");
  expect(exact.items[0].evidence?.file).toBe("dijitalatolye.json");
  expect(
    (
      await searchOutcomes({
        catalogId,
        programId,
        subjectId,
        grade: 5,
        report: {
          ...report,
          codes: [],
          passages: [
            {
              file: "index.html",
              location: "1",
              text: "oyun öğrenci başla doğru yanlış",
            },
          ],
        },
      })
    ).items,
  ).toHaveLength(0);
  expect(
    (
      await searchOutcomes({
        catalogId,
        programId,
        subjectId,
        grade: 5,
        report: {
          ...report,
          codes: [],
          passages: [
            {
              file: "index.html",
              location: "1",
              text: "fotosentez klorofil gezegen yörünge",
            },
          ],
        },
      })
    ).items,
  ).toHaveLength(0);
  const lexical = await searchOutcomes({
    catalogId,
    programId,
    subjectId,
    grade: 5,
    report: {
      ...report,
      codes: [],
      passages: [
        {
          file: "index.html",
          location: "1",
          text: "Günlük yaşamda kullanılan bilişim teknolojilerini sınıflandırın.",
        },
      ],
    },
  });
  expect(lexical.items.length).toBeGreaterThan(0);
  expect(lexical.items[0].reason).toBe("Metin eşleşmesi");
  expect(lexical.items.every((o) => o.evidence)).toBe(true);
});
it("rejects broken references and rolls back a database failure midway through a new catalog", async () => {
  const copy = path.join(root, "rollback-package");
  await cp("fixtures/curriculum-test", copy, { recursive: true });
  const relative = `outcomes/${programId}/grade-5.json`;
  const file = path.join(copy, relative);
  const document = JSON.parse(await readFile(file, "utf8"));
  const originalUnit = document.items[0].unitId;
  async function persist() {
    const bytes = Buffer.from(JSON.stringify(document));
    await writeFile(file, bytes);
    const manifestPath = path.join(copy, "file-manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    Object.assign(
      manifest.files.find((f: { path: string }) => f.path === relative),
      { bytes: bytes.length, sha256: digest(bytes) },
    );
    await writeFile(manifestPath, JSON.stringify(manifest));
  }
  document.items[0].unitId = "nonexistent-unit";
  await persist();
  await expect(importCurriculum(copy)).rejects.toThrow(/Kırık kazanım/);
  document.items[0].unitId = originalUnit;
  document.items[0].text += " Güncellenmiş test kaydı.";
  await persist();
  const changed = await inspectCurriculum(copy);
  // This trigger exists only in the guarded *_test DB. It fails after catalog,
  // source, program and unit writes have already reached PostgreSQL.
  await pool.query(
    `CREATE FUNCTION test_import_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'simulated storage failure'; END $$`,
  );
  await pool.query(
    `CREATE TRIGGER test_import_failure BEFORE INSERT ON curriculum_outcomes FOR EACH ROW EXECUTE FUNCTION test_import_failure()`,
  );
  try {
    await expect(importCurriculum(copy)).rejects.toThrow();
    expect((await activeCatalog())!.id).toBe(catalogId);
    expect(
      (
        await pool.query("SELECT id FROM curriculum_catalogs WHERE id=$1", [
          changed.id,
        ])
      ).rowCount,
    ).toBe(0);
    expect(
      (
        await pool.query(
          "SELECT id FROM curriculum_sources WHERE catalog_id=$1",
          [changed.id],
        )
      ).rowCount,
    ).toBe(0);
  } finally {
    await pool.query(
      "DROP TRIGGER test_import_failure ON curriculum_outcomes; DROP FUNCTION test_import_failure()",
    );
  }
});
it("protects drafts, freezes submitted metadata, blocks unverified publication and allows documented removal", async () => {
  const c = await createContent(uid);
  const id = crypto.randomUUID();
  await addVersion(c.id, uid, id, sha, "html");
  await db
    .update(versions)
    .set({
      state: "needs_metadata",
      entrypoint: "index.html",
      scanReport: {
        status: "clean",
        engine: "test-only",
        message: "test",
        at: new Date().toISOString(),
      },
    })
    .where(eq(versions.id, id));
  await expect(
    saveMetadata(id, "another-teacher", sha, 0, metadata()),
  ).rejects.toThrow(/sahibi/);
  await saveMetadata(id, uid, sha, 0, { title: "Di", description: "" });
  const saved = (await db.query.versions.findFirst({
    where: eq(versions.id, id),
  }))!;
  expect(saved.draftMetadata).toMatchObject({ title: "Di", description: "" });
  await expect(
    saveMetadata(id, uid, sha, 1, saved.draftMetadata, true),
  ).rejects.toThrow(/Başlık/);
  await expect(saveMetadata(id, uid, sha, 0, metadata())).rejects.toThrow(
    /değişti/,
  );
  await prepareReviewFixture(id,sha,metadata());
  await saveMetadata(id, uid, sha, 1, metadata(), true);
  await expect(saveMetadata(id, uid, sha, 2, metadata())).rejects.toThrow(
    /değişti/,
  );
  await expect(
    decide(id, sha, uid, "approve", "Kaynak kontrolü yapılmadan onay", 2),
  ).rejects.toThrow(/kaynak doğrulaması/);
  await expect(
    decide(id, sha, uid, "approve", "Eski form", 1, [oid]),
  ).rejects.toThrow(/değişti/);
  await decide(
    id,
    sha,
    uid,
    "approve",
    "Kaynak henüz doğrulanmadığı için kazanım çıkarıldı.",
    2,
    [oid],
  );
  expect(
    (await db.query.versions.findFirst({ where: eq(versions.id, id) }))!
      .excludedOutcomeIds,
  ).toEqual([oid]);
});
it("records source hash evidence independently from educational approval and rejects stale fingerprints", async () => {
  const selected = (await selectedOutcomes([{ catalogId, outcomeId: oid }]))[0];
  expect(selected.locallyVerified).toBe(false);
  const bytes = await readFile(path.join(root, "source.pdf"));
  const dest = path.join(settings().dataDir, "curriculum-sources");
  await mkdir(dest, { recursive: true });
  await writeFile(path.join(dest, digest(bytes) + ".pdf"), bytes);
  await expect(
    reviewOutcome(catalogId, oid, "changed", uid, "Kaynakta kontrol edildi."),
  ).rejects.toThrow(/değişti/);
  await reviewOutcome(
    catalogId,
    oid,
    selected.fingerprint,
    uid,
    "TEST ONLY: synthetic source fixture compared.",
  );
  expect(
    (await selectedOutcomes([{ catalogId, outcomeId: oid }]))[0]
      .locallyVerified,
  ).toBe(true);
  const c = await createContent(uid);
  const id = crypto.randomUUID();
  await addVersion(c.id, uid, id, sha, "html");
  await db
    .update(versions)
    .set({
      state: "needs_metadata",
      entrypoint: "index.html",
      scanReport: {
        status: "clean",
        engine: "test-only",
        message: "test",
        at: new Date().toISOString(),
      },
    })
    .where(eq(versions.id, id));
  await prepareReviewFixture(id,sha,metadata());
  await saveMetadata(id, uid, sha, 0, metadata(), true);
  expect(
    (await db.query.versions.findFirst({ where: eq(versions.id, id) }))!.state,
  ).toBe("review");
  await decide(
    id,
    sha,
    uid,
    "approve",
    "Oyunun eğitimsel uygunluğu ayrıca incelendi.",
    1,
  );
  expect(
    (await db.query.versions.findFirst({ where: eq(versions.id, id) }))!.state,
  ).toBe("publishing");
});
