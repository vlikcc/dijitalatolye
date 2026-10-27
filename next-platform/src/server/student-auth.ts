import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";
import { randomUUID, createHash } from "node:crypto";
import { pool, transaction } from "./db";
import { requireLearning } from "./learning-feature";
import { AppError } from "./errors";
import { limit, origin } from "./access";
const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9_]{3,30}$/,
    "Kullanıcı adı 3–30 harf, rakam veya alt çizgi içermeli.",
  );
const password = z.string().min(12).max(128);
export const tokenDigest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
async function guarded<T>(
  ctx: { request?: Request },
  action: () => Promise<T>,
) {
  try {
    requireLearning();
    if (!ctx.request) throw new AppError(403, "İstek kaynağı gerekli.");
    origin(ctx.request);
    return await action();
  } catch (e) {
    if (e instanceof AppError)
      throw new APIError(
        e.status === 404
          ? "NOT_FOUND"
          : e.status === 429
            ? "TOO_MANY_REQUESTS"
            : e.status === 403
              ? "FORBIDDEN"
              : e.status === 401
                ? "UNAUTHORIZED"
                : "BAD_REQUEST",
        { message: e.message },
      );
    if ((e as { code?: string }).code === "23505")
      throw new APIError("BAD_REQUEST", {
        message: "Bu kullanıcı adı kullanılıyor.",
      });
    throw e;
  }
}
export function studentAuth() {
  return {
    id: "student-auth",
    endpoints: {
      studentRegister: createAuthEndpoint(
        "/student/register",
        {
          method: "POST",
          body: z.object({
            username,
            password,
            name: z.string().trim().min(2).max(80),
            classCode: z.string().trim().toUpperCase().min(4).max(32),
          }),
        },
        (ctx) =>
          guarded(ctx, async () => {
            await limit("student-register:" + ctx.body.classCode, 30);
            const id = randomUUID();
            const hash = await ctx.context.password.hash(ctx.body.password);
            await transaction(async (_tx, c) => {
              const cls = (
                await c.query(
                  "SELECT id FROM classrooms WHERE join_code=$1 AND NOT archived FOR UPDATE",
                  [ctx.body.classCode],
                )
              ).rows[0];
              if (!cls)
                throw new AppError(
                  400,
                  "Sınıf kodu geçersiz veya sınıf kapalı.",
                );
              await c.query(
                "INSERT INTO users(id,name,email,email_verified,role) VALUES($1,$2,$3,false,'student')",
                [id, ctx.body.name, id + "@students.placeholder.invalid"],
              );
              await c.query(
                "INSERT INTO accounts(id,account_id,provider_id,user_id,password) VALUES($1,$2,'credential',$2,$3)",
                [randomUUID(), id, hash],
              );
              await c.query(
                "INSERT INTO student_profiles(user_id,username) VALUES($1,$2)",
                [id, ctx.body.username],
              );
              await c.query(
                "INSERT INTO classroom_members(class_id,student_id) VALUES($1,$2)",
                [cls.id, id],
              );
            });
            const user = await ctx.context.internalAdapter.findUserById(id);
            const session = await ctx.context.internalAdapter.createSession(id);
            if (!user || !session) throw new APIError("INTERNAL_SERVER_ERROR");
            await setSessionCookie(ctx, { user, session });
            return ctx.json({ ok: true });
          }),
      ),
      studentLogin: createAuthEndpoint(
        "/student/login",
        {
          method: "POST",
          body: z.object({ username, password: z.string().max(128).min(1) }),
        },
        (ctx) =>
          guarded(ctx, async () => {
            await limit("student-login:" + ctx.body.username, 15, 900);
            const row = (
              await pool.query(
                "SELECT u.id,a.password FROM student_profiles p JOIN users u ON u.id=p.user_id AND u.role='student' JOIN accounts a ON a.user_id=u.id AND a.provider_id='credential' WHERE p.username=$1",
                [ctx.body.username],
              )
            ).rows[0];
            // Password hashing on misses prevents a cheap account-enumeration timing path.
            const hash =
              row?.password || (await ctx.context.password.hash(randomUUID()));
            const valid = await ctx.context.password.verify({
              hash,
              password: ctx.body.password,
            });
            if (!row || !valid)
              throw new AppError(
                401,
                "Kullanıcı adı veya parola doğrulanamadı.",
              );
            const user = await ctx.context.internalAdapter.findUserById(row.id);
            const session = await ctx.context.internalAdapter.createSession(
              row.id,
            );
            if (!user || !session) throw new APIError("INTERNAL_SERVER_ERROR");
            await setSessionCookie(ctx, { user, session });
            return ctx.json({ ok: true });
          }),
      ),
      studentReset: createAuthEndpoint(
        "/student/reset",
        {
          method: "POST",
          body: z.object({
            username,
            code: z.string().min(16).max(100),
            password,
          }),
        },
        (ctx) =>
          guarded(ctx, async () => {
            await limit("student-reset:" + ctx.body.username, 10, 900);
            const hash = await ctx.context.password.hash(ctx.body.password);
            await transaction(async (_tx, c) => {
              const p = (
                await c.query(
                  "SELECT p.user_id FROM student_profiles p JOIN users u ON u.id=p.user_id AND u.role='student' WHERE username=$1 FOR UPDATE OF p",
                  [ctx.body.username],
                )
              ).rows[0];
              if (!p)
                throw new AppError(400, "Kod geçersiz veya süresi dolmuş.");
              const code = (
                await c.query(
                  "DELETE FROM student_resets WHERE student_id=$1 AND token_hash=$2 AND expires_at>now() RETURNING id",
                  [p.user_id, tokenDigest(ctx.body.code)],
                )
              ).rows[0];
              if (!code)
                throw new AppError(400, "Kod geçersiz veya süresi dolmuş.");
              await c.query(
                "UPDATE accounts SET password=$2,updated_at=now() WHERE user_id=$1 AND provider_id='credential'",
                [p.user_id, hash],
              );
              await c.query("DELETE FROM student_resets WHERE student_id=$1", [
                p.user_id,
              ]);
              await c.query("DELETE FROM sessions WHERE user_id=$1", [
                p.user_id,
              ]);
              await c.query(
                "INSERT INTO audit(actor_id,action,target_id) VALUES($1,'student.password_reset',$1)",
                [p.user_id],
              );
            });
            return ctx.json({ ok: true });
          }),
      ),
    },
  } satisfies BetterAuthPlugin;
}
