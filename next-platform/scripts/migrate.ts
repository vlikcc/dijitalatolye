import { migrate } from "drizzle-orm/node-postgres/migrator";
import { PgBoss } from "pg-boss";
import { db, pool } from "../src/server/db";
const lock = await pool.connect();
try {
  await lock.query("SELECT pg_advisory_lock(726351)");
  await migrate(db, { migrationsFolder: "drizzle" });
  await pool.query(
    "CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE INDEX IF NOT EXISTS version_search ON content_versions USING gin(to_tsvector('turkish', metadata->>'title' || ' ' || (metadata->>'description'))); CREATE INDEX IF NOT EXISTS version_title_trgm ON content_versions USING gin ((metadata->>'title') gin_trgm_ops)",
  );
  const b = new PgBoss({ connectionString: process.env.DATABASE_URL });
  await b.start();
  for (const q of ["scan", "extract-metadata", "render-cover", "publish"])
    await b.createQueue(q, {
      policy: "singleton",
      retryLimit: 3,
      retryDelay: 15,
      retryBackoff: true,
    });
  // Drain obsolete AI jobs only while workers are stopped for deployment.
  await pool.query(
    "UPDATE pgboss.job SET state='cancelled', completed_on=now() WHERE name='assess' AND state IN ('created','retry','active')",
  );
  await pool.query("UPDATE pgboss.job j SET state='cancelled',completed_on=now() FROM content_versions v WHERE j.name='publish' AND j.data->>'versionId'=v.id::text AND v.state='queued' AND j.state IN ('created','retry','active')");
  await pool.query("UPDATE content_versions SET scan_report=NULL WHERE state='queued' AND technical_report IS NULL");
  const queued=await pool.query("SELECT v.id,v.sha256,v.thumbnail,v.cover FROM content_versions v JOIN contents c ON c.draft_version_id=v.id WHERE v.state='queued' AND c.published_version_id IS DISTINCT FROM v.id");
  const {readFile,mkdir,copyFile}=await import("node:fs/promises");
  const {filePath,initStorage,hashFile}=await import("../src/modules/storage");
  await initStorage();
  for(const v of queued.rows) {
    if(v.thumbnail && !v.cover) {
      const old=filePath("thumbnails",v.id+".webp");
      try {
        await readFile(old);
        const inputId=crypto.randomUUID();await mkdir(filePath("cover-inputs",inputId));
        await copyFile(old,filePath("cover-inputs",inputId+"/input"));
        const cover={revision:0,selection:{mode:"upload",inputId,sha256:await hashFile(old)},status:"pending"};
        await pool.query("UPDATE content_versions SET cover=$2 WHERE id=$1 AND cover IS NULL",[v.id,JSON.stringify(cover)]);
      } catch { console.warn("Legacy draft cover unavailable",v.id); }
    }
    await b.send("scan",{versionId:v.id,sha256:v.sha256},{singletonKey:v.id});
  }
  const pending = await pool.query(
    "SELECT v.id,v.sha256 FROM content_versions v JOIN contents c ON c.draft_version_id=v.id WHERE v.state='extracting'",
  );
  for (const v of pending.rows)
    await b.send(
      "extract-metadata",
      { versionId: v.id, sha256: v.sha256 },
      { singletonKey: v.id },
    );
  await b.stop();
  console.log("Migrations and queues ready.");
} finally {
  await lock.query("SELECT pg_advisory_unlock(726351)");
  lock.release();
  await pool.end();
}
