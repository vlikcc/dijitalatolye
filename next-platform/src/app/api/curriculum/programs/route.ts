import { api, fail } from "@/server/errors";
import { actor } from "@/server/access";
import { curriculumOptions } from "@/modules/curriculum";
import { z } from "zod";
export const GET = api(async (r) => {
  await actor(r.headers);
  const q = new URL(r.url).searchParams;
  const p = z
    .object({
      grade: z.coerce.number().int().min(1).max(12),
      subjectId: z.uuid(),
      catalogId: z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .optional(),
    })
    .safeParse(Object.fromEntries(q));
  if (!p.success) fail(400, "Ders ve sınıf seçin.");
  return Response.json(
    await curriculumOptions(p.data.grade, p.data.subjectId, p.data.catalogId),
    { headers: { "Cache-Control": "no-store" } },
  );
});
