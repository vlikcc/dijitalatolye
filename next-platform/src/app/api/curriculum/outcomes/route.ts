import { api, fail } from "@/server/errors";
import { actor } from "@/server/access";
import { searchOutcomes } from "@/modules/curriculum";
import { owned } from "@/modules/content";
import { db } from "@/server/db";
import { versions } from "@/server/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
export const GET = api(async (r) => {
  const a = await actor(r.headers);
  const q = z
    .object({
      catalogId: z.string().regex(/^[a-f0-9]{64}$/),
      programId: z.string().min(1).max(150),
      grade: z.coerce.number().int().min(1).max(12),
      subjectId: z.uuid(),
      q: z.string().max(300).optional(),
      page: z.coerce.number().int().min(0).max(1000).optional(),
      versionId: z.uuid().optional(),
    })
    .safeParse(Object.fromEntries(new URL(r.url).searchParams));
  if (!q.success) fail(400, "Arama kapsamı geçersiz.");
  let report;
  if (q.data.versionId) {
    const v = await db.query.versions.findFirst({
      where: eq(versions.id, q.data.versionId),
    });
    if (!v) fail(404, "Sürüm bulunamadı.");
    await owned(v.contentId, a);
    if (v.scanReport?.status !== "clean" || !v.extraction)
      fail(409, "Bilgi çıkarımı henüz hazır değil.");
    report = v.extraction;
  }
  return Response.json(await searchOutcomes({ ...q.data, report }), {
    headers: { "Cache-Control": "no-store" },
  });
});
