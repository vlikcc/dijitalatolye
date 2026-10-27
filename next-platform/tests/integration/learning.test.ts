import { beforeAll, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { pool } from "../../src/server/db";
import { getAuth } from "../../src/server/auth";
import { actor } from "../../src/server/access";
import {
  createClass,
  changeClass,
  joinClass,
  createAssignment,
  changeAssignment,
  issueRecovery,
  startGame,
  saveGame,
  assignmentReport,
  studentDashboard,
  type LearningActor,
} from "../../src/modules/learning";
import { authorizeAsset } from "../../src/modules/game-access";
import { unpublish } from "../../src/modules/content";
const teacher: LearningActor = { id: randomUUID(), role: "teacher" },
  other: LearningActor = { id: randomUUID(), role: "teacher" };
let student: LearningActor,
  studentCookie: string,
  username: string,
  cls: any,
  contentId: string,
  versionId: string;
const origin = process.env.APP_URL!;
const headers = (cookie = "") =>
  new Headers({ origin, "Content-Type": "application/json", cookie });
async function auth(path: string, body: unknown, cookie = "") {
  return getAuth().handler(
    new Request(origin + "/api/auth/" + path, {
      method: "POST",
      headers: headers(cookie),
      body: JSON.stringify(body),
    }),
  );
}
const gameRequest = (extra = {}) => ({
  contentId,
  requestId: randomUUID(),
  ...extra,
});
const checkpoint = (revision: number, extra = {}) => ({
  requestId: randomUUID(),
  revision,
  state: { round: 1, solved: [0] },
  ...extra,
});
async function asset(url: string) {
  const u = new URL(url);
  return authorizeAsset(u.host, u.pathname);
}
beforeAll(async () => {
  if (!new URL(process.env.DATABASE_URL!).pathname.endsWith("_test"))
    throw Error("Dedicated *_test database required.");
  process.env.STUDENT_LEARNING_ENABLED = "true";
  for (const a of [teacher, other])
    await pool.query(
      "INSERT INTO users(id,name,email,email_verified,role) VALUES($1,'Teacher',$2,true,'teacher')",
      [a.id, a.id + "@test.invalid"],
    );
  cls = await createClass(teacher, { name: "4-A Learning" });
  username = "student_" + randomUUID().slice(0, 8);
  const response = await auth("student/register", {
    name: "Test Student",
    username,
    password: "Learning test password!",
    classCode: cls.join_code,
  });
  expect(response.status, await response.clone().text()).toBe(200);
  studentCookie = response.headers.get("set-cookie")!.split(";")[0];
  student = await actor(headers(studentCookie), ["student"]);
  contentId = randomUUID();
  versionId = randomUUID();
  await pool.query("INSERT INTO contents(id,owner_id,slug) VALUES($1,$2,$3)", [
    contentId,
    teacher.id,
    "learning-" + contentId,
  ]);
  await pool.query(
    "INSERT INTO content_versions(id,content_id,sha256,format,state,entrypoint,tracking,metadata,scan_report,manifest) VALUES($1,$2,$3,'zip','published','index.html',true,$4,$5,$6)",
    [
      versionId,
      contentId,
      "a".repeat(64),
      JSON.stringify({ title: "Learning game", grade: 4, description: "Test" }),
      JSON.stringify({ status: "clean" }),
      JSON.stringify([{ path: "index.html", sha256: "a".repeat(64), size: 1 }]),
    ],
  );
  await pool.query("UPDATE contents SET published_version_id=$2 WHERE id=$1", [
    contentId,
    versionId,
  ]);
});
afterAll(async () => {
  await pool.end();
});
it("registers an unverified student with pending membership, forbids staff APIs, allows free play", async () => {
  const u = (await pool.query("SELECT * FROM users WHERE id=$1", [student.id]))
    .rows[0];
  expect(u.email_verified).toBe(false);
  expect(u.role).toBe("student");
  expect((await studentDashboard(student)).classes[0].status).toBe("pending");
  await expect(actor(headers(studentCookie))).rejects.toMatchObject({
    status: 403,
  });
  await expect(createClass(student, { name: "No" })).rejects.toMatchObject({
    status: 403,
  });
  const game = await startGame(student, gameRequest());
  expect(game.tracking).toBe(true);
  expect(await asset(game.gameUrl)).toBeTruthy();
});
it("approves multiple classes but only the first approving teacher owns recovery", async () => {
  await changeClass(teacher, cls.id, {
    action: "approve",
    studentId: student.id,
  });
  const second = await createClass(other, { name: "Other class" });
  await joinClass(student, { classCode: second.join_code });
  await changeClass(other, second.id, {
    action: "approve",
    studentId: student.id,
  });
  await expect(issueRecovery(other, student.id)).rejects.toMatchObject({
    status: 403,
  });
  expect((await issueRecovery(teacher, student.id)).code).toHaveLength(32);
  await expect(
    changeClass(other, cls.id, { action: "archive" }),
  ).rejects.toMatchObject({ status: 404 });
});
it("separates assignments from free play and resumes checkpoints across sessions", async () => {
  const free = await startGame(student, gameRequest());
  await saveGame(
    student,
    free.sessionId,
    checkpoint(0, { complete: true, score: 90 }),
  );
  const assignment = await createAssignment(teacher, {
    classId: cls.id,
    contentId,
    title: "Homework",
  });
  const run = await startGame(
    student,
    gameRequest({ assignmentId: assignment.id }),
  );
  expect(run.state).toBeNull();
  const body = checkpoint(0, { progress: 33, score: 40 });
  expect(await saveGame(student, run.sessionId, body)).toEqual({ revision: 1 });
  expect(await saveGame(student, run.sessionId, body)).toEqual({ revision: 1 });
  await expect(
    saveGame(student, run.sessionId, { ...body, state: { tampered: true } }),
  ).rejects.toMatchObject({ status: 409 });
  const res = await auth("student/login", {
    username,
    password: "Learning test password!",
  });
  const second = await actor(
    headers(res.headers.get("set-cookie")!.split(";")[0]),
    ["student"],
  );
  const resumed = await startGame(
    second,
    gameRequest({ assignmentId: assignment.id }),
  );
  expect(resumed.state).toEqual(body.state);
  expect(resumed.revision).toBe(1);
  await saveGame(
    second,
    resumed.sessionId,
    checkpoint(1, { score: 75, complete: true }),
  );
  await expect(
    saveGame(student, run.sessionId, checkpoint(1)),
  ).rejects.toMatchObject({ status: 409 });
  const report = await assignmentReport(teacher, assignment.id);
  expect(report.rows[0]).toMatchObject({
    attempts: 1,
    score: 75,
    best_score: 75,
    completed: true,
  });
  await expect(assignmentReport(other, assignment.id)).rejects.toMatchObject({
    status: 404,
  });
  const restarted = await startGame(
    student,
    gameRequest({ assignmentId: assignment.id, restart: true }),
  );
  expect(restarted.state).toBeNull();
  expect(
    (await assignmentReport(teacher, assignment.id)).rows[0].attempts,
  ).toBe(2);
});
it("rejects another student's checkpoint and oversized/invalid payloads", async () => {
  const run = await startGame(student, gameRequest({ restart: true }));
  await expect(
    saveGame({ ...student, id: other.id }, run.sessionId, checkpoint(0)),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    saveGame(
      student,
      run.sessionId,
      checkpoint(0, { state: "x".repeat(128 * 1024) }),
    ),
  ).rejects.toMatchObject({ status: 413 });
  await expect(
    saveGame(student, run.sessionId, checkpoint(0, { score: 101 })),
  ).rejects.toMatchObject({ status: 400 });
});
it("snapshots recipients and rejects an unapproved recipient", async () => {
  await expect(
    createAssignment(teacher, {
      classId: cls.id,
      contentId,
      title: "Invalid",
      studentIds: [other.id],
    }),
  ).rejects.toMatchObject({ status: 400 });
  const assignment = await createAssignment(teacher, {
    classId: cls.id,
    contentId,
    title: "Selected",
    studentIds: [student.id],
  });
  await changeAssignment(teacher, assignment.id, {
    action: "add",
    studentIds: [student.id],
  });
  expect((await assignmentReport(teacher, assignment.id)).rows).toHaveLength(1);
});
it("allows overdue work until closed; closing and removing membership revoke sessions", async () => {
  const assignment = await createAssignment(teacher, {
    classId: cls.id,
    contentId,
    title: "Overdue",
    dueAt: "2020-01-01T00:00:00Z",
  });
  const run = await startGame(
    student,
    gameRequest({ assignmentId: assignment.id }),
  );
  await saveGame(student, run.sessionId, checkpoint(0));
  await changeAssignment(teacher, assignment.id, { action: "close" });
  await expect(
    saveGame(student, run.sessionId, checkpoint(1)),
  ).rejects.toMatchObject({ status: 409 });
  expect(await asset(run.gameUrl)).toBeNull();
  const another = await createAssignment(teacher, {
    classId: cls.id,
    contentId,
    title: "Removal",
  });
  const active = await startGame(
    student,
    gameRequest({ assignmentId: another.id }),
  );
  await changeClass(teacher, cls.id, {
    action: "remove",
    studentId: student.id,
  });
  expect(await asset(active.gameUrl)).toBeNull();
  await expect(
    saveGame(student, active.sessionId, checkpoint(0)),
  ).rejects.toMatchObject({ status: 403 });
  await changeClass(teacher, cls.id, {
    action: "approve",
    studentId: student.id,
  });
});
it("pins versions across publication changes and revokes every pinned version on unpublish", async () => {
  const old = await startGame(student, gameRequest());
  const newId = randomUUID();
  await pool.query(
    "INSERT INTO content_versions(id,content_id,sha256,format,state,entrypoint,tracking,metadata,scan_report,manifest) SELECT $2,content_id,sha256,format,state,entrypoint,tracking,metadata,scan_report,manifest FROM content_versions WHERE id=$1",
    [versionId, newId],
  );
  await pool.query("UPDATE contents SET published_version_id=$2 WHERE id=$1", [
    contentId,
    newId,
  ]);
  expect(await asset(old.gameUrl)).toBeTruthy();
  const resumed = await startGame(student, gameRequest());
  expect(new URL(resumed.gameUrl).host).toContain(versionId);
  const newRun = await startGame(student, gameRequest({ restart: true }));
  expect(new URL(newRun.gameUrl).host).toContain(newId);
  await unpublish(contentId, teacher.id);
  expect(await asset(old.gameUrl)).toBeNull();
  expect(await asset(newRun.gameUrl)).toBeNull();
  await expect(
    saveGame(student, newRun.sessionId, checkpoint(0)),
  ).rejects.toMatchObject({ status: 410 });
  // Restoring the catalog pointer cannot resurrect a revoked version.
  await pool.query("UPDATE contents SET published_version_id=$2 WHERE id=$1", [
    contentId,
    newId,
  ]);
  expect(await asset(old.gameUrl)).toBeNull();
});
it("single-use recovery changes password, revokes sessions and remains admin-transferable", async () => {
  const { code } = await issueRecovery(teacher, student.id);
  const r = await auth("student/reset", {
    username,
    code,
    password: "A different test password!",
  });
  expect(r.status, await r.clone().text()).toBe(200);
  expect(
    (
      await auth("student/reset", {
        username,
        code,
        password: "Another test password!",
      })
    ).status,
  ).toBe(400);
  await expect(
    actor(headers(studentCookie), ["student"]),
  ).rejects.toMatchObject({ status: 401 });
  expect(
    (
      await auth("student/login", {
        username,
        password: "Learning test password!",
      })
    ).status,
  ).toBe(401);
  expect(
    (
      await auth("student/login", {
        username,
        password: "A different test password!",
      })
    ).status,
  ).toBe(200);
  await expect(issueRecovery(other, student.id, true)).rejects.toMatchObject({
    status: 403,
  });
});
it("code rotation, archive, unsupported tracking and expired recovery stay bounded", async () => {
  const classroom = await createClass(teacher, { name: "Archived class" });
  const rotated = await changeClass(teacher, classroom.id, {
    action: "rotate",
  });
  expect(rotated.join_code).not.toBe(classroom.join_code);
  await expect(
    joinClass(student, { classCode: classroom.join_code }),
  ).rejects.toMatchObject({ status: 404 });
  await joinClass(student, { classCode: rotated.join_code });
  await changeClass(teacher, classroom.id, { action: "archive" });
  await expect(
    joinClass(student, { classCode: rotated.join_code }),
  ).rejects.toMatchObject({ status: 404 });
  await expect(
    createAssignment(teacher, {
      classId: classroom.id,
      contentId,
      title: "Closed class",
    }),
  ).rejects.toMatchObject({ status: 409 });
  const reset = await issueRecovery(teacher, student.id);
  await pool.query(
    "UPDATE student_resets SET expires_at=now()-interval '1 minute' WHERE student_id=$1",
    [student.id],
  );
  expect(
    (
      await auth("student/reset", {
        username,
        code: reset.code,
        password: "Expired recovery password!",
      })
    ).status,
  ).toBe(400);
  const login = await auth("student/login", {
    username,
    password: "A different test password!",
  });
  const current = await actor(
    headers(login.headers.get("set-cookie")!.split(";")[0]),
    ["student"],
  );
  const noTrackId = randomUUID();
  await pool.query(
    "INSERT INTO content_versions(id,content_id,sha256,format,state,entrypoint,tracking,metadata,scan_report,manifest) SELECT $2,content_id,sha256,format,state,entrypoint,false,metadata,scan_report,manifest FROM content_versions WHERE id=$1",
    [versionId, noTrackId],
  );
  await pool.query("UPDATE contents SET published_version_id=$2 WHERE id=$1", [
    contentId,
    noTrackId,
  ]);
  const run = await startGame(current, gameRequest({ restart: true }));
  expect(run.tracking).toBe(false);
  await expect(
    saveGame(current, run.sessionId, checkpoint(0, { complete: true })),
  ).rejects.toMatchObject({ status: 400 });
  const assignment = await createAssignment(teacher, {
    classId: cls.id,
    contentId,
    title: "Untracked game",
  });
  await startGame(current, gameRequest({ assignmentId: assignment.id }));
  expect(
    (await assignmentReport(teacher, assignment.id)).rows[0],
  ).toMatchObject({
    completed: false,
    progress: null,
    score: null,
    attempts: 1,
  });
  await pool.query(
    "UPDATE game_attempts SET updated_at='2020-01-01' WHERE assignment_id=$1",
    [assignment.id],
  );
  const reopen = gameRequest({ assignmentId: assignment.id });
  await startGame(current, reopen);
  const activity = (await assignmentReport(teacher, assignment.id)).rows[0]
    .last_activity;
  expect(new Date(activity).getTime()).toBeGreaterThan(Date.now() - 10000);
  await startGame(current, reopen);
  expect(
    (await assignmentReport(teacher, assignment.id)).rows[0].last_activity,
  ).toEqual(activity);
});
it("feature flag fails closed for registration and all learning operations", async () => {
  process.env.STUDENT_LEARNING_ENABLED = "false";
  expect(
    (
      await auth("student/login", {
        username,
        password: "A different test password!",
      })
    ).status,
  ).toBe(404);
  await expect(
    createClass(teacher, { name: "Disabled" }),
  ).rejects.toMatchObject({ status: 404 });
  process.env.STUDENT_LEARNING_ENABLED = "true";
});
