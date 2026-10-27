import { api } from "@/server/errors";
import { actor } from "@/server/access";
import { owned } from "@/modules/content";
import { db } from "@/server/db";
import { versions } from "@/server/schema";
import { eq, desc } from "drizzle-orm";
export const GET = api(async (r, c) => {
  const a = await actor(r.headers);
  const { id } = await c.params;
  const content = await owned(id, a);
  return Response.json(
    {
      content,
      versions: (
        await db
          .select()
          .from(versions)
          .where(eq(versions.contentId, id))
          .orderBy(desc(versions.createdAt))
      ).map(({ archivedAiReport: _archive, ...version }) => version),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
});
