import { rolesFor } from "@/lib/permissions";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { api, fail } from "@/server/errors";
import { actor, origin, limit } from "@/server/access";
import { transaction } from "@/server/db";
import { grades, audit } from "@/server/schema";

export const POST = api(async (request, context) => {
  origin(request);
  const user = await actor(request.headers, rolesFor("administer"));
  await limit(`grades:${user.id}`, 120);
  const { value } = await context.params;
  const parsed = z
    .object({ active: z.boolean() })
    .strict()
    .safeParse(await request.json());
  const grade = Number(value);
  if (!parsed.success || !Number.isInteger(grade) || grade < 1 || grade > 12)
    fail(400, "Sınıf bilgilerini kontrol edin.");
  await transaction(async (tx) => {
    const changed = await tx
      .update(grades)
      .set(parsed.data)
      .where(eq(grades.value, grade))
      .returning();
    if (!changed.length) fail(404, "Sınıf bulunamadı.");
    await tx
      .insert(audit)
      .values({
        actorId: user.id,
        action: "grade.updated",
        targetId: String(grade),
        details: parsed.data,
      });
  });
  return Response.json({ ok: true });
});
