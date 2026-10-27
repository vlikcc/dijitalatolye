import { createHash } from "node:crypto";
import { pool } from "../server/db";
import { learningEnabled } from "../server/learning-feature";
import { bundledDemoOnly, requireUploads } from "../server/demo-deployment";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { settings } from "../server/env";
import { db } from "../server/db";
import { versions, contents } from "../server/schema";
export async function previewToken(id: string, sha256: string) {
  return new SignJWT({ sha256, scope: "preview" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(id)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(settings().previewSecret));
}
export function gameUrl(id: string, entry: string, token?: string, playToken?: string) {
  requireUploads();
  const e = settings();
  return `${e.gameProtocol}://v-${id}.${e.gameDomain}${e.gamePort ? ":" + e.gamePort : ""}/${playToken ? "session/" + playToken : token ? "preview/" + token : "play"}/${entry.split("/").map(encodeURIComponent).join("/")}`;
}
export async function authorizeAsset(host: string, uri: string) {
  if (bundledDemoOnly()) return null;
  const env = settings();
  const suffix = "." + env.gameDomain;
  const hostname = host.split(":")[0];
  if (!hostname.endsWith(suffix)) return null;
  const id = hostname.slice(0, -suffix.length).replace(/^v-/, "");
  if (!/^[a-f0-9-]{36}$/.test(id)) return null;
  const v = await db.query.versions.findFirst({ where: eq(versions.id, id) });
  if (!v || v.scanReport?.status !== "clean") return null;
  const raw = uri.split("?")[0];
  const preview = raw.match(/^\/preview\/([^/]+)\/(.+)$/);
  const tracked = raw.match(/^\/session\/([^/]+)\/(.+)$/);
  const play = raw.match(/^\/play\/(.+)$/);
  let file: string;
  let area: "ready" | "published";
  if (preview) {
    try {
      const { payload } = await jwtVerify(
        preview[1],
        new TextEncoder().encode(env.previewSecret),
        { algorithms: ["HS256"], subject: id },
      );
      if (payload.scope !== "preview" || payload.sha256 !== v.sha256)
        return null;
    } catch {
      return null;
    }
    file = preview[2];
    area = "ready";
  } else if (tracked) {
    if (!learningEnabled() || v.revokedAt || v.state !== "published") return null;
    const access = await pool.query(`SELECT s.id FROM game_sessions s
      JOIN sessions auth ON auth.id=s.auth_session_id AND auth.expires_at>now()
      JOIN game_attempts g ON g.id=s.attempt_id AND g.student_id=auth.user_id
      JOIN users u ON u.id=g.student_id AND u.role='student'
      JOIN contents co ON co.id=$3 AND co.published_version_id IS NOT NULL
      WHERE s.token_hash=$1 AND g.version_id=$2 AND s.expires_at>now()
      AND (g.assignment_id IS NULL OR EXISTS (
        SELECT 1 FROM assignments a JOIN classrooms cl ON cl.id=a.class_id AND NOT cl.archived
        JOIN classroom_members m ON m.class_id=cl.id AND m.student_id=g.student_id AND m.status='active'
        JOIN assignment_students r ON r.assignment_id=a.id AND r.student_id=g.student_id
        WHERE a.id=g.assignment_id AND NOT a.closed))`,
      [createHash("sha256").update(tracked[1]).digest("hex"), id, v.contentId]);
    if (!access.rowCount) return null;
    file = tracked[2]; area = "published";
  } else if (play) {
    const c = await db.query.contents.findFirst({
      where: eq(contents.id, v.contentId),
    });
    if (c?.publishedVersionId !== id || v.revokedAt) return null;
    file = play[1];
    area = "published";
  } else return null;
  try {
    file = decodeURIComponent(file);
  } catch {
    return null;
  }
  if (!v.manifest.some((f) => f.path === file)) return null;
  return { id, area, file };
}
