import { rolesFor } from "@/lib/permissions";
import { api, fail } from "@/server/errors";
import { actor, origin } from "@/server/access";
import { transaction } from "@/server/db";
import { user, session, audit } from "@/server/schema";
import { eq } from "drizzle-orm";
export const POST = api(async (r, c) => {
  origin(r);
  const a = await actor(r.headers, rolesFor("administer"));
  const { id } = await c.params;
  const { role } = await r.json();
  if (id === a.id || !["teacher", "editor", "admin"].includes(role))
    fail(400, "Bu rol değişikliğine izin verilmiyor.");
  await transaction(async (tx) => {
    const current = await tx.query.user.findFirst({ where: eq(user.id, id) });
    if (current?.role === "student") fail(400, "Öğrenci hesabı öğretmen rolüne dönüştürülemez.");
    const [u] = await tx
      .update(user)
      .set({ role })
      .where(eq(user.id, id))
      .returning();
    if (!u) fail(404, "Kullanıcı bulunamadı.");
    await tx.delete(session).where(eq(session.userId, id));
    await tx.insert(audit).values({
      actorId: a.id,
      action: "user.role_changed",
      targetId: id,
      details: { role },
    });
  });
  return Response.json({ ok: true });
});
