import { can } from "../lib/permissions";
import { randomBytes, createHash, createHmac } from "node:crypto";
import type { PoolClient } from "pg";
import { z } from "zod";
import { pool, transaction } from "../server/db";
import { fail } from "../server/errors";
import { requireLearning } from "../server/learning-feature";
import { settings } from "../server/env";
import { gameUrl } from "./game-access";
import type { AssignmentReuseSeed } from "../lib/learning-workspace";
export type LearningActor = { id: string; role: string; sessionId?: string };
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export function parsed<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success)
    fail(400, "Bilgileri kontrol edin: " + result.error.issues[0].message);
  return result.data;
}
const uuid = z.string().uuid();
const short = z.string().trim().min(1).max(120);
export const classInput = z.object({ name: short });
export const assignmentInput = z.object({
  classId: uuid,
  contentId: uuid,
  title: short,
  instructions: z.string().max(3000).default(""),
  dueAt: z.iso.datetime({ offset: true }).nullable().optional(),
  studentIds: z.array(z.string().min(1).max(100)).min(1).max(500).optional(),
});
export const startInput = z.object({
  contentId: uuid,
  assignmentId: uuid.optional(),
  restart: z.boolean().default(false),
  requestId: uuid,
});
export const checkpointInput = z.object({
  requestId: uuid,
  revision: z.number().int().min(0),
  state: z.unknown().refine((v) => v !== undefined, "Oyun kaydı gerekli."),
  progress: z.number().int().min(0).max(100).optional(),
  score: z.number().int().min(0).max(100).optional(),
  complete: z.boolean().default(false),
});
export async function boundedBody(r: Request) {
  const reader = r.body?.getReader();
  if (!reader) fail(400, "İstek gövdesi gerekli.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 140 * 1024) {
      await reader.cancel();
      fail(413, "Oyun kaydı çok büyük.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    fail(400, "Geçerli JSON gerekli.");
  }
}
function teacher(a: LearningActor) {
  requireLearning();
  if (!can(a.role, "teach")) fail(403, "Öğretmen yetkisi gerekli.");
}
function student(a: LearningActor) {
  requireLearning();
  if (a.role !== "student") fail(403, "Öğrenci hesabı gerekli.");
}
const code = () => randomBytes(6).toString("hex").toUpperCase();
async function ownedClass(c: PoolClient, id: string, a: LearningActor) {
  teacher(a);
  const row = (
    await c.query(
      "SELECT * FROM classrooms WHERE id=$1 AND teacher_id=$2 FOR UPDATE",
      [id, a.id],
    )
  ).rows[0];
  if (!row) fail(404, "Sınıf bulunamadı.");
  return row;
}
export async function createClass(a: LearningActor, data: unknown) {
  teacher(a);
  const body = parsed(classInput, data);
  return (
    await pool.query(
      "INSERT INTO classrooms(teacher_id,name,join_code) VALUES($1,$2,$3) RETURNING *",
      [a.id, body.name, code()],
    )
  ).rows[0];
}
export async function changeClass(a: LearningActor, id: string, data: unknown) {
  parsed(uuid, id);
  const body = parsed(
    z.object({
      action: z.enum(["rotate", "archive", "approve", "remove", "reject"]),
      studentId: z.string().optional(),
    }),
    data,
  );
  return transaction(async (_tx, c) => {
    const cls = await ownedClass(c, id, a);
    if (cls.archived) fail(409, "Sınıf arşivlenmiş.");
    if (body.action === "rotate")
      return (
        await c.query(
          "UPDATE classrooms SET join_code=$2 WHERE id=$1 RETURNING *",
          [id, code()],
        )
      ).rows[0];
    if (body.action === "archive") {
      await c.query("UPDATE classrooms SET archived=true WHERE id=$1", [id]);
      return { ok: true };
    }
    if (!body.studentId) fail(400, "Öğrenci seçin.");
    const status = body.action === "approve" ? "active" : "removed";
    const member = (
      await c.query(
        "UPDATE classroom_members SET status=$3 WHERE class_id=$1 AND student_id=$2 RETURNING student_id",
        [id, body.studentId, status],
      )
    ).rows[0];
    if (!member) fail(404, "Üyelik bulunamadı.");
    if (status === "active")
      await c.query(
        "UPDATE student_profiles SET recovery_teacher_id=$2 WHERE user_id=$1 AND recovery_teacher_id IS NULL",
        [body.studentId, a.id],
      );
    await c.query(
      "INSERT INTO audit(actor_id,action,target_id,details) VALUES($1,$2,$3,$4)",
      [
        a.id,
        "class.member_" + status,
        id,
        JSON.stringify({ studentId: body.studentId }),
      ],
    );
    return { ok: true };
  });
}
export async function joinClass(a: LearningActor, data: unknown) {
  student(a);
  const { classCode } = parsed(
    z.object({ classCode: z.string().trim().toUpperCase().min(4).max(32) }),
    data,
  );
  return transaction(async (_tx, c) => {
    const cls = (
      await c.query(
        "SELECT id FROM classrooms WHERE join_code=$1 AND NOT archived FOR SHARE",
        [classCode],
      )
    ).rows[0];
    if (!cls) fail(404, "Sınıf kodu geçersiz veya sınıf kapalı.");
    await c.query(
      "INSERT INTO classroom_members(class_id,student_id) VALUES($1,$2) ON CONFLICT(class_id,student_id) DO UPDATE SET status=CASE WHEN classroom_members.status='active' THEN 'active' ELSE 'pending' END",
      [cls.id, a.id],
    );
    return { ok: true };
  });
}
export async function issueRecovery(
  a: LearningActor,
  studentId: string,
  takeover = false,
) {
  requireLearning();
  if (!can(a.role, "recover")) fail(403, "Hesap kurtarma yetkiniz yok.");
  return transaction(async (_tx, c) => {
    const p = (
      await c.query(
        "SELECT * FROM student_profiles WHERE user_id=$1 FOR UPDATE",
        [studentId],
      )
    ).rows[0];
    if (!p) fail(404, "Öğrenci bulunamadı.");
    if (takeover) {
      if (!can(a.role, "administer")) fail(403, "Admin yetkisi gerekli.");
      await c.query(
        "UPDATE student_profiles SET recovery_teacher_id=$2 WHERE user_id=$1",
        [studentId, a.id],
      );
    } else if (p.recovery_teacher_id !== a.id)
      fail(403, "Hesap kurtarma yetkiniz yok.");
    const token = randomBytes(24).toString("base64url");
    await c.query("DELETE FROM student_resets WHERE student_id=$1", [
      studentId,
    ]);
    await c.query(
      "INSERT INTO student_resets(student_id,token_hash,expires_at) VALUES($1,$2,now()+interval '15 minutes')",
      [studentId, digest(token)],
    );
    await c.query(
      "INSERT INTO audit(actor_id,action,target_id) VALUES($1,$2,$3)",
      [
        a.id,
        takeover ? "student.recovery_takeover" : "student.recovery_issued",
        studentId,
      ],
    );
    return { code: token, expiresInMinutes: 15 };
  });
}
async function addRecipients(
  c: PoolClient,
  classId: string,
  assignmentId: string,
  ids?: string[],
) {
  const rows = (
    await c.query(
      "SELECT student_id FROM classroom_members WHERE class_id=$1 AND status='active' AND ($2::text[] IS NULL OR student_id=ANY($2))",
      [classId, ids ?? null],
    )
  ).rows;
  if (!rows.length || (ids && new Set(ids).size !== rows.length))
    fail(400, "Yalnızca sınıfın onaylı öğrencileri seçilebilir.");
  for (const r of rows)
    await c.query(
      "INSERT INTO assignment_students(assignment_id,student_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
      [assignmentId, r.student_id],
    );
}
export async function createAssignment(a: LearningActor, data: unknown) {
  teacher(a);
  const b = parsed(assignmentInput, data);
  return transaction(async (_tx, c) => {
    const cls = await ownedClass(c, b.classId, a);
    if (cls.archived) fail(409, "Sınıf arşivlenmiş.");
    const v = (
      await c.query(
        "SELECT v.id FROM contents co JOIN content_versions v ON v.id=co.published_version_id WHERE co.id=$1 AND v.revoked_at IS NULL AND v.state='published' AND v.scan_report->>'status'='clean' FOR SHARE OF co,v",
        [b.contentId],
      )
    ).rows[0];
    if (!v) fail(400, "Yayımlanmış bir oyun seçin.");
    const assignment = (
      await c.query(
        "INSERT INTO assignments(class_id,version_id,title,instructions,due_at) VALUES($1,$2,$3,$4,$5) RETURNING *",
        [b.classId, v.id, b.title, b.instructions, b.dueAt ?? null],
      )
    ).rows[0];
    await addRecipients(c, b.classId, assignment.id, b.studentIds);
    return assignment;
  });
}
export async function changeAssignment(
  a: LearningActor,
  id: string,
  data: unknown,
) {
  teacher(a);
  parsed(uuid, id);
  const b = parsed(
    z.object({
      action: z.enum(["close", "add"]),
      studentIds: z
        .array(z.string().min(1).max(100))
        .min(1)
        .max(500)
        .optional(),
    }),
    data,
  );
  return transaction(async (_tx, c) => {
    const assignment = (
      await c.query("SELECT * FROM assignments WHERE id=$1", [id])
    ).rows[0];
    if (!assignment) fail(404, "Ödev bulunamadı.");
    const cls = await ownedClass(c, assignment.class_id, a);
    const current = (
      await c.query("SELECT closed FROM assignments WHERE id=$1 FOR UPDATE", [
        id,
      ])
    ).rows[0];
    if (cls.archived || current.closed) fail(409, "Ödev kapalı.");
    if (b.action === "close")
      await c.query("UPDATE assignments SET closed=true WHERE id=$1", [id]);
    else {
      if (!b.studentIds) fail(400, "Öğrenci seçin.");
      await addRecipients(c, assignment.class_id, id, b.studentIds);
    }
    return { ok: true };
  });
}
// Called under the student's advisory lock; class lock serializes membership and closing changes.
async function assignmentAccess(
  c: PoolClient,
  assignmentId: string,
  studentId: string,
) {
  const base = (
    await c.query("SELECT class_id FROM assignments WHERE id=$1", [
      assignmentId,
    ])
  ).rows[0];
  if (!base) fail(404, "Ödev bulunamadı.");
  const cls = (
    await c.query("SELECT archived FROM classrooms WHERE id=$1 FOR SHARE", [
      base.class_id,
    ])
  ).rows[0];
  const a = (
    await c.query(
      "SELECT a.* FROM assignments a JOIN assignment_students r ON r.assignment_id=a.id AND r.student_id=$2 JOIN classroom_members m ON m.class_id=a.class_id AND m.student_id=$2 AND m.status='active' WHERE a.id=$1",
      [assignmentId, studentId],
    )
  ).rows[0];
  if (!a) fail(403, "Bu ödeve erişiminiz yok.");
  if (cls.archived || a.closed) fail(409, "Ödev kapalı.");
  return a;
}
async function lockStudent(c: PoolClient, id: string) {
  await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1,4267))", [
    id,
  ]);
}
const sessionToken = (authId: string, requestId: string) =>
  createHmac("sha256", settings().previewSecret)
    .update("learning:" + authId + ":" + requestId)
    .digest("base64url");
export async function startGame(a: LearningActor, data: unknown) {
  student(a);
  const b = parsed(startInput, data);
  if (!a.sessionId) fail(401, "Giriş gerekli.");
  return transaction(async (_tx, c) => {
    await lockStudent(c, a.id);
    const assignment = b.assignmentId
      ? await assignmentAccess(c, b.assignmentId, a.id)
      : null;
    const existingSession = (
      await c.query(
        "SELECT s.*,g.version_id,g.assignment_id,v.content_id FROM game_sessions s JOIN game_attempts g ON g.id=s.attempt_id JOIN content_versions v ON v.id=g.version_id WHERE s.auth_session_id=$1 AND s.request_id=$2",
        [a.sessionId, b.requestId],
      )
    ).rows[0];
    if (
      existingSession &&
      (existingSession.content_id !== b.contentId ||
        existingSession.assignment_id !== (b.assignmentId ?? null))
    )
      fail(409, "İstek kimliği başka oyun için kullanılmış.");
    let attempt = existingSession
      ? (
          await c.query("SELECT * FROM game_attempts WHERE id=$1", [
            existingSession.attempt_id,
          ])
        ).rows[0]
      : null;
    if (!attempt && !b.restart)
      attempt = (
        await c.query(
          "SELECT g.* FROM game_attempts g JOIN content_versions v ON v.id=g.version_id WHERE g.student_id=$1 AND v.content_id=$2 AND g.assignment_id IS NOT DISTINCT FROM $3::uuid ORDER BY g.created_at DESC,g.id DESC LIMIT 1",
          [a.id, b.contentId, b.assignmentId ?? null],
        )
      ).rows[0];
    const content = (
      await c.query("SELECT * FROM contents WHERE id=$1 FOR SHARE", [
        b.contentId,
      ])
    ).rows[0];
    const versionId =
      attempt?.version_id ??
      assignment?.version_id ??
      content?.published_version_id;
    const v = (
      await c.query(
        "SELECT * FROM content_versions WHERE id=$1 AND content_id=$2 AND state='published' AND revoked_at IS NULL AND scan_report->>'status'='clean' FOR SHARE",
        [versionId, b.contentId],
      )
    ).rows[0];
    if (!content?.published_version_id || !v?.entrypoint)
      fail(410, "Bu oyun sürümü artık kullanılamıyor.");
    if (!attempt)
      attempt = (
        await c.query(
          "INSERT INTO game_attempts(student_id,version_id,assignment_id) VALUES($1,$2,$3) RETURNING *",
          [a.id, v.id, b.assignmentId ?? null],
        )
      ).rows[0];
    const token = sessionToken(a.sessionId!, b.requestId);
    let s = existingSession;
    if (!s) {
      s = (
        await c.query(
          "INSERT INTO game_sessions(attempt_id,auth_session_id,token_hash,request_id,expires_at) VALUES($1,$2,$3,$4,now()+interval '8 hours') RETURNING *",
          [attempt.id, a.sessionId, digest(token), b.requestId],
        )
      ).rows[0];
      // Opening an existing attempt is activity even when a legacy game has
      // no checkpoint support. Replaying the same start request is not.
      await c.query("UPDATE game_attempts SET updated_at=now() WHERE id=$1", [
        attempt.id,
      ]);
    }
    if (new Date(s.expires_at) <= new Date())
      fail(409, "Oyun oturumunu yeniden açın.");
    return {
      sessionId: s.id,
      gameUrl: gameUrl(v.id, v.entrypoint, undefined, token),
      title: v.metadata.title,
      tracking: v.tracking,
      state: attempt.state,
      revision: attempt.revision,
      progress: attempt.progress,
      score: attempt.score,
      completed: !!attempt.completed_at,
    };
  });
}
export async function saveGame(
  a: LearningActor,
  sessionId: string,
  data: unknown,
) {
  student(a);
  parsed(uuid, sessionId);
  const b = parsed(checkpointInput, data);
  if (Buffer.byteLength(JSON.stringify(b.state), "utf8") > 128 * 1024)
    fail(413, "Oyun kaydı 128 KiB sınırını aşıyor.");
  const fingerprint = digest(JSON.stringify(b));
  return transaction(async (_tx, c) => {
    await lockStudent(c, a.id);
    const s = (
      await c.query(
        "SELECT s.*,g.assignment_id,g.student_id,g.version_id FROM game_sessions s JOIN game_attempts g ON g.id=s.attempt_id JOIN sessions auth ON auth.id=s.auth_session_id AND auth.expires_at>now() WHERE s.id=$1 AND s.auth_session_id=$2 AND s.expires_at>now() AND g.student_id=$3",
        [sessionId, a.sessionId, a.id],
      )
    ).rows[0];
    if (!s) fail(403, "Oyun oturumu geçersiz. Yeniden giriş yapın.");
    if (s.assignment_id) await assignmentAccess(c, s.assignment_id, a.id);
    const v = (
      await c.query(
        "SELECT v.tracking FROM content_versions v JOIN contents co ON co.id=v.content_id WHERE v.id=$1 AND v.revoked_at IS NULL AND v.state='published' AND v.scan_report->>'status'='clean' AND co.published_version_id IS NOT NULL FOR SHARE OF co,v",
        [s.version_id],
      )
    ).rows[0];
    if (!v) fail(410, "Oyun yayından kaldırılmış.");
    if (!v.tracking)
      fail(400, "Bu oyun kayıt ve sonuç bildirimini desteklemiyor.");
    const prev = (
      await c.query(
        "SELECT * FROM game_events WHERE session_id=$1 AND request_id=$2",
        [sessionId, b.requestId],
      )
    ).rows[0];
    if (prev) {
      if (prev.digest !== fingerprint)
        fail(409, "İstek kimliği farklı kayıtla kullanılmış.");
      return { revision: prev.revision };
    }
    const attempt = (
      await c.query("SELECT * FROM game_attempts WHERE id=$1 FOR UPDATE", [
        s.attempt_id,
      ])
    ).rows[0];
    if (attempt.revision !== b.revision)
      fail(
        409,
        "Oyun başka bir sekmede veya cihazda değişti. Güncel kaydı yeniden yükleyin.",
      );
    if (attempt.completed_at)
      fail(409, "Bu deneme tamamlanmış. Yeniden oynamak için baştan başlayın.");
    const next = attempt.revision + 1;
    await c.query(
      "UPDATE game_attempts SET state=$2,revision=$3,progress=COALESCE($4,progress),score=COALESCE($5,score),completed_at=CASE WHEN $6 THEN now() ELSE NULL END,updated_at=now() WHERE id=$1",
      [
        attempt.id,
        JSON.stringify(b.state),
        next,
        b.complete ? 100 : (b.progress ?? null),
        b.score ?? null,
        b.complete,
      ],
    );
    await c.query(
      "INSERT INTO game_events(session_id,request_id,digest,revision) VALUES($1,$2,$3,$4)",
      [sessionId, b.requestId, fingerprint, next],
    );
    return { revision: next };
  });
}
export async function assignmentReuseSeed(
  a: LearningActor,
  id: string,
): Promise<AssignmentReuseSeed> {
  teacher(a);
  if (!uuid.safeParse(id).success) fail(404, "Ödev bulunamadı.");
  const source = (
    await pool.query(
      `SELECT a.id,a.title,a.instructions,v.content_id,
        current.id AS current_version_id,a.version_id
       FROM assignments a JOIN classrooms c ON c.id=a.class_id
       JOIN content_versions v ON v.id=a.version_id
       JOIN contents co ON co.id=v.content_id
       LEFT JOIN content_versions current ON current.id=co.published_version_id
         AND current.revoked_at IS NULL AND current.state='published'
         AND current.scan_report->>'status'='clean'
       WHERE a.id=$1 AND c.teacher_id=$2`,
      [id, a.id],
    )
  ).rows[0];
  if (!source) fail(404, "Ödev bulunamadı.");
  return {
    sourceId: source.id,
    title: source.title,
    instructions: source.instructions,
    contentId: source.content_id,
    gameAvailable: !!source.current_version_id,
    gameUpdated:
      !!source.current_version_id &&
      source.current_version_id !== source.version_id,
  };
}
export async function teacherDashboard(a: LearningActor) {
  teacher(a);
  const classes = (
    await pool.query(
      "SELECT * FROM classrooms WHERE teacher_id=$1 ORDER BY created_at DESC",
      [a.id],
    )
  ).rows;
  const members = (
    await pool.query(
      "SELECT m.*,u.name,p.username,p.recovery_teacher_id FROM classroom_members m JOIN classrooms c ON c.id=m.class_id JOIN users u ON u.id=m.student_id JOIN student_profiles p ON p.user_id=m.student_id WHERE c.teacher_id=$1 ORDER BY u.name",
      [a.id],
    )
  ).rows;
  const assignments = (
    await pool.query(
      "SELECT a.*,c.name AS class_name,v.metadata->>'title' AS game_title,v.tracking FROM assignments a JOIN classrooms c ON c.id=a.class_id JOIN content_versions v ON v.id=a.version_id WHERE c.teacher_id=$1 ORDER BY a.created_at DESC",
      [a.id],
    )
  ).rows;
  const games = (
    await pool.query(
      "SELECT c.id,v.metadata->>'title' AS title,v.tracking,v.metadata->>'grade' AS grade,v.metadata->>'subjectId' AS \"subjectId\",t.label AS subject FROM contents c JOIN content_versions v ON v.id=c.published_version_id LEFT JOIN taxonomy t ON t.id::text=v.metadata->>'subjectId' WHERE v.revoked_at IS NULL AND v.state='published' AND v.scan_report->>'status'='clean' ORDER BY v.metadata->>'title'",
    )
  ).rows;
  return { classes, members, assignments, games };
}
export async function assignmentReport(a: LearningActor, id: string) {
  teacher(a);
  parsed(uuid, id);
  const assignment = (
    await pool.query(
      "SELECT a.*,c.name AS class_name,v.tracking,v.metadata->>'title' AS game_title FROM assignments a JOIN classrooms c ON c.id=a.class_id JOIN content_versions v ON v.id=a.version_id WHERE a.id=$1 AND c.teacher_id=$2",
      [id, a.id],
    )
  ).rows[0];
  if (!assignment) fail(404, "Ödev bulunamadı.");
  const rows = (
    await pool.query(
      `SELECT u.id,u.name,p.username,m.status AS membership,
    COUNT(g.id)::int AS attempts,MAX(g.score) AS best_score,MAX(g.updated_at) AS last_activity,
    BOOL_OR(g.completed_at IS NOT NULL) AS completed,
    (SELECT progress FROM game_attempts x WHERE x.assignment_id=$1 AND x.student_id=u.id ORDER BY created_at DESC,id DESC LIMIT 1) AS progress,
    (SELECT score FROM game_attempts x WHERE x.assignment_id=$1 AND x.student_id=u.id ORDER BY created_at DESC,id DESC LIMIT 1) AS score
    FROM assignment_students r JOIN users u ON u.id=r.student_id JOIN student_profiles p ON p.user_id=u.id
    JOIN classroom_members m ON m.class_id=$2 AND m.student_id=u.id
    LEFT JOIN game_attempts g ON g.assignment_id=r.assignment_id AND g.student_id=u.id
    WHERE r.assignment_id=$1 GROUP BY u.id,p.username,m.status ORDER BY u.name`,
      [id, assignment.class_id],
    )
  ).rows;
  return { assignment, rows };
}
export async function studentDashboard(a: LearningActor) {
  student(a);
  const classes = (
    await pool.query(
      "SELECT c.id,c.name,c.archived,m.status,u.name AS teacher_name FROM classroom_members m JOIN classrooms c ON c.id=m.class_id JOIN users u ON u.id=c.teacher_id WHERE m.student_id=$1 ORDER BY c.created_at DESC",
      [a.id],
    )
  ).rows;
  const assignments = (
    await pool.query(
      `SELECT a.*,v.content_id,v.tracking,v.metadata->>'title' AS game_title,c.name AS class_name,c.archived,m.status AS membership,u.name AS teacher_name,
    EXISTS(SELECT 1 FROM game_attempts g WHERE g.student_id=$1 AND g.assignment_id=a.id AND g.completed_at IS NOT NULL) AS completed,
    EXISTS(SELECT 1 FROM game_attempts g WHERE g.student_id=$1 AND g.assignment_id=a.id) AS started,
    (SELECT progress FROM game_attempts g WHERE g.student_id=$1 AND g.assignment_id=a.id ORDER BY created_at DESC,id DESC LIMIT 1) AS progress,
    (SELECT score FROM game_attempts g WHERE g.student_id=$1 AND g.assignment_id=a.id ORDER BY created_at DESC,id DESC LIMIT 1) AS score
    FROM assignment_students r JOIN assignments a ON a.id=r.assignment_id JOIN classrooms c ON c.id=a.class_id
    JOIN users u ON u.id=c.teacher_id JOIN classroom_members m ON m.class_id=c.id AND m.student_id=$1
    JOIN content_versions v ON v.id=a.version_id WHERE r.student_id=$1 ORDER BY a.created_at DESC`,
      [a.id],
    )
  ).rows;
  const games = (
    await pool.query(
      "SELECT DISTINCT ON(v.content_id) g.*,v.content_id,v.metadata->>'title' AS title,v.tracking FROM game_attempts g JOIN content_versions v ON v.id=g.version_id WHERE g.student_id=$1 AND g.assignment_id IS NULL ORDER BY v.content_id,g.created_at DESC,g.id DESC",
      [a.id],
    )
  ).rows;
  const profile = (
    await pool.query(
      "SELECT p.username,u.name AS recovery_teacher FROM student_profiles p LEFT JOIN users u ON u.id=p.recovery_teacher_id WHERE p.user_id=$1",
      [a.id],
    )
  ).rows[0];
  return { classes, assignments, games, profile };
}
