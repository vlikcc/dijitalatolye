// Local operational check: enqueue while the worker is stopped, then replace web
// and worker containers. Never run against a deployed environment.
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { eq } from "drizzle-orm";
import { db, pool } from "../../src/server/db";
import { user, taxonomy, versions, contents } from "../../src/server/schema";
import { createContent, addVersion } from "../../src/modules/content";
import { initStorage, filePath, hashFile } from "../../src/modules/storage";
import { boss } from "../../src/server/queue";
const local = ["localhost", "127.0.0.1"];
if (
  !local.includes(new URL(process.env.APP_URL!).hostname) ||
  !local.includes(new URL(process.env.DATABASE_URL!).hostname)
)
  throw Error("This check only runs on the local Compose stack.");
const args = [
  "compose",
  "-f",
  "deploy/compose.dev.yml",
  "-f",
  "deploy/compose.worker-dev.yml",
  "-f",
  "deploy/compose.web-dev.yml",
];
const compose = (...command: string[]) =>
  execFileSync("docker", [...args, ...command], { stdio: "inherit" });
const versionId = crypto.randomUUID();
const actorId = crypto.randomUUID();
try {
  const subject = await db.query.taxonomy.findFirst({
    where: eq(taxonomy.kind, "subject"),
  });
  if (!subject) throw Error("Run seed first.");
  await db
    .insert(user)
    .values({
      id: actorId,
      name: "Demo recovery fixture",
      email: `${actorId}@example.test`,
      emailVerified: true,
    });
  const content = await createContent(actorId, "Demo recovery fixture");
  await initStorage();
  await writeFile(
    filePath("quarantine", versionId),
    "<!doctype html><html lang=tr><title>Demo</title><h1>Yeniden başlatma kontrolü</h1></html>",
  );
  const hash = await hashFile(filePath("quarantine", versionId));
  compose("stop", "worker");
  await addVersion(content.id, actorId, versionId, hash, "html", {
    title: "Demo recovery fixture",
    description: "Yerel worker yeniden başlatma deneyi için demo içerik.",
    grade: 4,
    subjectId: subject.id,
    outcomeIds: [],
    demo: true,
  });
  const pending = await db.query.versions.findFirst({
    where: eq(versions.id, versionId),
  });
  if (pending?.state !== "queued" || !pending.jobId)
    throw Error("Durable queued job missing.");
  compose(
    "up",
    "-d",
    "--no-build",
    "--no-deps",
    "--force-recreate",
    "web",
    "worker",
  );
  const deadline = Date.now() + 120000;
  let ready = false;
  while (Date.now() < deadline) {
    const version = await db.query.versions.findFirst({
      where: eq(versions.id, versionId),
    });
    if (version?.state === "needs_metadata" && version.cover?.status === "ready" && version.technicalReport?.status === "complete") {
      ready = true;
      break;
    }
    if (["rejected", "scan_error"].includes(version?.state || ""))
      throw Error(`Recovery failed: ${version?.state}`);
    await delay(1000);
  }
  if (!ready)
    throw Error(
      "Worker did not recover the queued version within 120 seconds.",
    );
  const live = await db
    .select({ id: versions.id, entrypoint: versions.entrypoint })
    .from(contents)
    .innerJoin(versions, eq(contents.publishedVersionId, versions.id))
    .limit(1);
  if (live.length) {
    let status = "";
    for (let i = 0; i < 20; i++) {
      status = execFileSync(
        "curl",
        [
          "-s",
          "-o",
          "/dev/null",
          "-w",
          "%{http_code}",
          "-H",
          `Host: v-${live[0].id}.games.localhost:58080`,
          `http://127.0.0.1:58080/play/${live[0].entrypoint}`,
        ],
        { encoding: "utf8" },
      );
      if (status === "200") break;
      await delay(1000);
    }
    if (status !== "200")
      throw Error("Nginx did not reconnect to the replacement web container.");
  }
  console.log(
    "PASS: queued upload, technical report and cover survived worker recreation; existing game remained accessible through Nginx.",
  );
} finally {
  compose("start", "worker", "web");
  await (await boss()).stop();
  await pool.end();
}
