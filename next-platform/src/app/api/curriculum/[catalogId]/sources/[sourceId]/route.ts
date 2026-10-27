import { api, fail } from "@/server/errors";
import { actor, limit } from "@/server/access";
import { db } from "@/server/db";
import { curriculumSources } from "@/server/schema";
import { and, eq } from "drizzle-orm";
import { ensureSource } from "@/modules/curriculum-source";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
export const GET = api(async (r, c) => {
  const a = await actor(r.headers, ["editor", "admin"]);
  await limit("source:" + a.id, 120);
  const { catalogId, sourceId } = await c.params;
  const source = await db.query.curriculumSources.findFirst({
    where: and(
      eq(curriculumSources.catalogId, catalogId),
      eq(curriculumSources.id, sourceId),
    ),
  });
  if (!source) fail(404, "Kaynak bulunamadı.");
  const file = await ensureSource(source.data);
  return new Response(
    Readable.toWeb(createReadStream(file)) as ReadableStream,
    {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="meb-${source.data.sha256}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox; default-src 'none'",
      },
    },
  );
});
