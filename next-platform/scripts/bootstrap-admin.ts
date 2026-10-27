import { eq } from "drizzle-orm";
import { db, pool } from "../src/server/db";
import { user, session, audit } from "../src/server/schema";
const email = process.argv[2];
if (!email) throw Error("Kullanım: pnpm bootstrap-admin ogretmen@example.com");
await db.transaction(async (tx) => {
  const u = await tx.query.user.findFirst({ where: eq(user.email, email) });
  if (!u?.emailVerified)
    throw Error("Önce kayıt olun ve e-posta adresinizi doğrulayın.");
  const admins = await tx.select().from(user).where(eq(user.role, "admin"));
  if (admins.length)
    throw Error(
      "İlk yönetici zaten var; diğer rolleri yönetim ekranından değiştirin.",
    );
  await tx.update(user).set({ role: "admin" }).where(eq(user.id, u.id));
  await tx.delete(session).where(eq(session.userId, u.id));
  await tx
    .insert(audit)
    .values({ actorId: u.id, action: "admin.bootstrapped", targetId: u.id });
  console.log("Yönetici rolü atandı. Tekrar giriş yapıp 2FA kurun.");
});
await pool.end();
