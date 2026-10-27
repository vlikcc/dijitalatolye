import { api, fail } from "@/server/errors";
import { actor } from "@/server/access";
import { owned } from "@/modules/content";
import { db } from "@/server/db";
import { versions } from "@/server/schema";
import { eq } from "drizzle-orm";
export const GET = api(async (r, c) => {
  const a = await actor(r.headers);
  const { id } = await c.params;
  const v = await db.query.versions.findFirst({ where: eq(versions.id, id) });
  if (!v) fail(404, "Sürüm bulunamadı.");
  await owned(v.contentId, a);
  return Response.json(
    {
      versionId: id,
      sha256: v.sha256,
      state: v.state,
      revision: v.metadataRevision,
      extraction: v.extraction,
      draftMetadata: v.draftMetadata,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
});
