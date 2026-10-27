import { rolesFor } from "@/lib/permissions";
import { api, fail } from "@/server/errors";
import { actor, origin } from "@/server/access";
import { db } from "@/server/db";
import { taxonomy } from "@/server/schema";
import { eq } from "drizzle-orm";
export const POST = api(async (r) => {
  origin(r);
  await actor(r.headers, rolesFor("administer"));
  const { kind, label, parentId, id, active } = await r.json();
  if (id) {
    await db
      .update(taxonomy)
      .set({ active: active === true })
      .where(eq(taxonomy.id, id));
    return Response.json({ ok: true });
  }
  if (
    !["subject", "outcome"].includes(kind) ||
    typeof label !== "string" ||
    label.length < 2 ||
    label.length > 500
  )
    fail(400, "Ders/kazanım bilgilerini kontrol edin.");
  if (kind === "outcome") {
    const p = await db.query.taxonomy.findFirst({
      where: eq(taxonomy.id, parentId),
    });
    if (p?.kind !== "subject") fail(400, "Kazanım için ders seçin.");
  }
  return Response.json(
    (
      await db
        .insert(taxonomy)
        .values({ kind, label, parentId: kind === "outcome" ? parentId : null })
        .returning()
    )[0],
  );
});
