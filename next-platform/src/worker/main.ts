import { boss, queues } from "../server/queue";
import { processJob, type Payload } from "./pipeline";
import { pool } from "../server/db";
import { log } from "../server/errors";
import { writeFile } from "node:fs/promises";
const queue = await boss();
async function heartbeat() {
  try {
    await pool.query("SELECT 1");
    await writeFile("/tmp/dijital-worker-heartbeat", String(Date.now()));
  } catch (e) {
    log("worker.health_failed");
  }
}
await heartbeat();
const healthTimer = setInterval(() => void heartbeat(), 15000);
healthTimer.unref();
for (const name of queues)
  await queue.work<Payload>(
    name,
    { batchSize: 1, includeMetadata: true },
    async (jobs) => {
      for (const job of jobs) {
        log("job.started", {
          queue: name,
          jobId: job.id,
          versionId: job.data.versionId,
        });
        await processJob(name, job.data, job.retryCount);
        log("job.completed", { queue: name, jobId: job.id });
      }
    },
  );
log("worker.ready");
let stopping = false;
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    clearInterval(healthTimer);
    void (async () => {
      await queue.stop({ graceful: true, timeout: 30000 });
      await pool.end();
      process.exit(0);
    })();
  });
