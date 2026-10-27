import pg from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
const g = globalThis as unknown as { pool?: pg.Pool };
export const pool =
  g.pool ??
  new pg.Pool({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://app:local-only@127.0.0.1:55432/dijital",
    max: 10,
  });
if (process.env.NODE_ENV !== "production") g.pool = pool;
export const db = drizzle(pool, { schema });
export async function transaction<T>(
  fn: (tx: NodePgDatabase<typeof schema>, client: pg.PoolClient) => Promise<T>,
) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const result = await fn(drizzle(c, { schema }), c);
    await c.query("COMMIT");
    return result;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
