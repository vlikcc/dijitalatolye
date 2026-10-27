import {decideForTest as decide} from "../helpers/review";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { writeFile, rm, readFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { db, pool, transaction } from "../../src/server/db";
import {
  user,
  taxonomy,
  versions,
  contents,
  grades,
} from "../../src/server/schema";
import {
  createContent,
  addVersion,
  unpublish,
  catalog,
  owned,
  validateMetadata,
  saveMetadata,
} from "../../src/modules/content";
import { initStorage, filePath, hashFile } from "../../src/modules/storage";
import { processJob } from "../../src/worker/pipeline";
import { boss, enqueue } from "../../src/server/queue";
import { authorizeAsset, previewToken } from "../../src/modules/game-access";
import { clamScan } from "../../src/modules/scanner";
import { SignJWT } from "jose";
import { settings } from "../../src/server/env";
let uid: string, subjectId: string;
beforeAll(async () => {
  if (!new URL(process.env.DATABASE_URL!).pathname.endsWith("_test"))
    throw Error("Integration tests require a dedicated *_test database.");
  await initStorage();
  uid = crypto.randomUUID();
  await db.insert(user).values({
    id: uid,
    name: "Test Teacher",
    email: `${uid}@test.invalid`,
    emailVerified: true,
  });
  subjectId = (
    await db
      .insert(taxonomy)
      .values({ kind: "subject", label: `Matematik-${uid}` })
      .returning()
  )[0].id;
});
afterAll(async () => {
  await (await boss()).stop();
  await pool.end();
});
async function upload(
  title = "Işığın keşfi",
  contentId?: string,
  source = "<h1>Merhaba</h1>",
) {
  const c = contentId
    ? await db.query.contents.findFirst({ where: eq(contents.id, contentId) })
    : await createContent(uid, title);
  const id = crypto.randomUUID();
  await writeFile(filePath("quarantine", id), source);
  const sha256 = await hashFile(filePath("quarantine", id));
  await addVersion(c!.id, uid, id, sha256, "html", {
    title,
    description: "Sınıfta birlikte keşfetmek için örnek oyun.",
    grade: 4,
    subjectId,
    outcomeIds: [],
  });
  return { c: c!, id, sha256 };
}
const version = (id: string) =>
  db.query.versions.findFirst({ where: eq(versions.id, id) });
async function review(v: Awaited<ReturnType<typeof upload>>) {
  await processJob("scan", { versionId: v.id, sha256: v.sha256 });
  expect((await version(v.id))?.state).toBe("extracting");
  await processJob(
    "extract-metadata",
    { versionId: v.id, sha256: v.sha256 },
    3,
  );
  expect((await version(v.id))?.state).toBe("needs_metadata");
  let current = (await version(v.id))!;
  await processJob("render-cover",{versionId:v.id,sha256:v.sha256,coverRevision:current.cover!.revision});
  current = (await version(v.id))!;
  await saveMetadata(
    v.id,
    uid,
    v.sha256,
    current.metadataRevision,
    current.draftMetadata,
    true,
  );
  expect((await version(v.id))?.state).toBe("review");
}
describe("real PostgreSQL + ClamAV + YARA lifecycle", () => {
  it("rejects inactive grade definitions for new uploads", async () => {
    const metadata = {
      title: "Kesir oyunu",
      description: "Birlikte öğrenmek için örnek bir oyun.",
      grade: 12,
      subjectId,
      outcomeIds: [],
    };
    await db.update(grades).set({ active: false }).where(eq(grades.value, 12));
    try {
      await expect(validateMetadata(metadata)).rejects.toThrow(
        /yeni yüklemelere kapalı/,
      );
    } finally {
      await db.update(grades).set({ active: true }).where(eq(grades.value, 12));
    }
    await expect(validateMetadata(metadata)).resolves.toMatchObject({
      grade: 12,
    });
  });
  it("retains durable jobs across queue client restart", async () => {
    const { PgBoss } = await import("pg-boss");
    const first = new PgBoss({
      connectionString: process.env.DATABASE_URL,
      migrate: false,
    });
    await first.start();
    const queue = "restart-" + crypto.randomUUID();
    await first.createQueue(queue);
    const id = await first.send(queue, { marker: "survives" });
    await first.stop();
    const second = new PgBoss({
      connectionString: process.env.DATABASE_URL,
      migrate: false,
    });
    await second.start();
    try {
      const jobs = await second.fetch<{ marker: string }>(queue);
      expect(jobs[0].id).toBe(id);
      expect(jobs[0].data.marker).toBe("survives");
      await second.complete(queue, jobs[0].id);
    } finally {
      await second.stop();
    }
  });
  it("rolls back content and queued job together", async () => {
    const id = crypto.randomUUID();
    await expect(
      transaction(async (tx, client) => {
        await tx.insert(contents).values({ id, ownerId: uid, slug: id });
        await enqueue("scan", id, "bad", client);
        throw Error("rollback");
      }),
    ).rejects.toThrow();
    expect(
      await db.query.contents.findFirst({ where: eq(contents.id, id) }),
    ).toBeUndefined();
    const jobs = await pool.query(
      "select count(*) from pgboss.job where data->>'versionId'=$1",
      [id],
    );
    expect(Number(jobs.rows[0].count)).toBe(0);
  });
  it("runs upload → scan → review → publication, is idempotent, searches Turkish and revokes direct access", async () => {
    const v = await upload();
    await review(v);
    expect((await version(v.id))?.extraction?.status).toBe("complete");
    await decide(v.id, v.sha256, uid, "approve", "Ders için uygun.");
    await processJob("publish", { versionId: v.id, sha256: v.sha256 });
    await processJob("publish", { versionId: v.id, sha256: v.sha256 });
    expect(
      (await db.query.contents.findFirst({ where: eq(contents.id, v.c.id) }))
        ?.publishedVersionId,
    ).toBe(v.id);
    expect(
      (await catalog({ q: "ışığın" })).some((x) => x.version.id === v.id),
    ).toBe(true);
    const host = `v-${v.id}.${settings().gameDomain}`;
    expect(await authorizeAsset(host, "/play/index.html")).not.toBeNull();
    await unpublish(v.c.id, uid);
    expect(await authorizeAsset(host, "/play/index.html")).toBeNull();
  });
  it("does not let stale scan or editor decision approve a new version", async () => {
    const old = await upload("Eski oyun");
    await review(old);
    const current = await upload("Yeni oyun", old.c.id, "<h1>Yeni paket</h1>");
    await expect(
      decide(old.id, old.sha256, uid, "approve", "Eski onay"),
    ).rejects.toThrow();
    await processJob("scan", { versionId: current.id, sha256: old.sha256 });
    expect((await version(current.id))?.state).toBe("queued");
    await processJob("extract-metadata", {
      versionId: old.id,
      sha256: old.sha256,
    });
    expect((await version(current.id))?.state).toBe("queued");
  });
  it("keeps teacher edits when an extraction job is delivered twice", async () => {
    const v = await upload("Öğretmen başlığı");
    await processJob("scan", { versionId: v.id, sha256: v.sha256 });
    await processJob("extract-metadata", { versionId: v.id, sha256: v.sha256 });
    await saveMetadata(v.id, uid, v.sha256, 0, {
      title: "Öğretmenin düzelttiği başlık",
      description: "",
    });
    const before = await version(v.id);
    await processJob("extract-metadata", { versionId: v.id, sha256: v.sha256 });
    const after = await version(v.id);
    expect(after?.draftMetadata).toEqual(before?.draftMetadata);
    expect(after?.metadataRevision).toBe(1);
    expect(after?.extraction).toEqual(before?.extraction);
  });
  it("keeps old publication on broken artifact preparation", async () => {
    const first = await upload("Yayındaki oyun");
    await review(first);
    await decide(first.id, first.sha256, uid, "approve", "İlk onay");
    await processJob("publish", { versionId: first.id, sha256: first.sha256 });
    const second = await upload("Yeni sürüm", first.c.id);
    await review(second);
    await decide(second.id, second.sha256, uid, "approve", "İkinci onay");
    await rm(filePath("ready", second.id), { recursive: true });
    await expect(
      processJob("publish", { versionId: second.id, sha256: second.sha256 }),
    ).rejects.toThrow();
    expect(
      (
        await db.query.contents.findFirst({
          where: eq(contents.id, first.c.id),
        })
      )?.publishedVersionId,
    ).toBe(first.id);
  });
  it("blocks EICAR and scanner outages", async () => {
    const eicar =
      "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";
    const v = await upload("EICAR test", undefined, eicar);
    await processJob("scan", { versionId: v.id, sha256: v.sha256 });
    expect((await version(v.id))?.state).toBe("rejected");
    const clean = await upload("Kesinti testi");
    const port = process.env.CLAMAV_PORT;
    process.env.CLAMAV_PORT = "1";
    try {
      await expect(
        processJob("scan", { versionId: clean.id, sha256: clean.sha256 }),
      ).rejects.toThrow();
      expect((await version(clean.id))?.scanReport?.status).toBe("error");
    } finally {
      process.env.CLAMAV_PORT = port;
    }
  });
  it("binds preview to version/hash/expiry and forbids another teacher", async () => {
    const v = await upload("Önizleme testi");
    await review(v);
    const host = `v-${v.id}.${settings().gameDomain}`;
    const valid = await previewToken(v.id, v.sha256);
    expect(
      await authorizeAsset(host, `/preview/${valid}/index.html`),
    ).not.toBeNull();
    const expired = await new SignJWT({ sha256: v.sha256, scope: "preview" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(v.id)
      .setExpirationTime("1 second ago")
      .sign(new TextEncoder().encode(settings().previewSecret));
    expect(
      await authorizeAsset(host, `/preview/${expired}/index.html`),
    ).toBeNull();
    expect(
      await authorizeAsset(host, `/preview/${valid}/../secret`),
    ).toBeNull();
    await expect(
      owned(v.c.id, { id: "other", role: "teacher" }),
    ).rejects.toThrow();
  });
  it("does not resurrect a cancelled in-flight publication", async () => {
    const v = await upload("İptal testi");
    await review(v);
    await decide(v.id, v.sha256, uid, "approve", "Yayın onayı");
    await unpublish(v.c.id, uid);
    await processJob("publish", { versionId: v.id, sha256: v.sha256 });
    expect(
      (await db.query.contents.findFirst({ where: eq(contents.id, v.c.id) }))
        ?.publishedVersionId,
    ).toBeNull();
  });
});
