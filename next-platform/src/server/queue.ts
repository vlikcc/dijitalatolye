import { PgBoss } from "pg-boss";
import type { PoolClient } from "pg";
import { settings } from "./env";
let promise: Promise<PgBoss> | undefined;
export const queues = ["scan", "extract-metadata", "render-cover", "publish"] as const;
export function boss() {
  return (promise ??= (async () => {
    const b = new PgBoss({
      connectionString: settings().databaseUrl,
      application_name: "dijital",
      migrate: false,
    });
    b.on("error", (e) =>
      console.error(
        JSON.stringify({ event: "queue_error", message: e.message }),
      ),
    );
    await b.start();
    return b;
  })());
}
export async function enqueue(
  name: (typeof queues)[number],
  versionId: string,
  sha256: string,
  client: PoolClient,
  extra: {coverRevision?:number} = {},
) {
  const b = await boss();
  return b.send(
    name,
    { versionId, sha256, ...extra },
    {
      singletonKey: name === "render-cover" ? `${versionId}:${extra.coverRevision}` : versionId,
      retryLimit: 3,
      retryDelay: 15,
      retryBackoff: true,
      expireInSeconds: 900,
      db: {
        executeSql: (text: string, values: unknown[]) =>
          client.query(text, values),
      },
    },
  );
}
