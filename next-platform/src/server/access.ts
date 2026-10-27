import { rolesFor } from "../lib/permissions";
import { requireLearning } from "./learning-feature";
import { getAuth } from "./auth";
import { fail } from "./errors";
import { pool } from "./db";
import { settings } from "./env";
export async function actor(
  headers: Headers,
  roles: string[] = rolesFor("inspect"),
  staff2fa = true,
) {
  const s = await getAuth().api.getSession({ headers });
  if (!s) fail(401, "Devam etmek için giriş yapın.");
  if (s.user.role === "student") requireLearning();
  if (s.user.role !== "student" && !s.user.emailVerified)
    fail(403, "E-posta adresinizi doğrulayın.");
  if (!roles.includes(s.user.role)) fail(403, "Bu işlem için yetkiniz yok.");
  if (
    staff2fa &&
    ["editor", "admin"].includes(s.user.role) &&
    !s.user.twoFactorEnabled
  )
    fail(403, "Önce hesabınızda iki aşamalı doğrulamayı etkinleştirin.");
  return { ...s.user, sessionId: s.session.id };
}
export function origin(request: Request) {
  if (request.headers.get("origin") !== new URL(settings().appUrl).origin)
    fail(403, "İsteğin kaynağı doğrulanamadı.");
}
export async function limit(key: string, max = 20, seconds = 3600) {
  const result = await pool.query(
    `INSERT INTO rate_limits(key,count,"window") VALUES($1,1,now()) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits."window" < now()-make_interval(secs=>$2) THEN 1 ELSE rate_limits.count+1 END,"window"=CASE WHEN rate_limits."window" < now()-make_interval(secs=>$2) THEN now() ELSE rate_limits."window" END RETURNING count`,
    [key, seconds],
  );
  if (result.rows[0].count > max)
    fail(429, "Çok fazla işlem yaptınız. Bir süre sonra tekrar deneyin.");
}
