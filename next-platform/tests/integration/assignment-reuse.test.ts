import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { pool } from "../../src/server/db";
import {
  assignmentReuseSeed,
  assignmentReport,
  createAssignment,
  createClass,
  teacherDashboard,
  type LearningActor,
} from "../../src/modules/learning";
const teacher: LearningActor = { id: randomUUID(), role: "teacher" };
const other: LearningActor = { id: randomUUID(), role: "teacher" };
const studentId = randomUUID();
let source: { id: string },
  classId: string,
  contentId: string,
  oldVersion: string,
  newVersion: string;
beforeAll(async () => {
  if (!new URL(process.env.DATABASE_URL!).pathname.endsWith("_test"))
    throw Error("Dedicated test database required");
  process.env.STUDENT_LEARNING_ENABLED = "true";
  for (const a of [teacher, other, { id: studentId, role: "student" }])
    await pool.query(
      "INSERT INTO users(id,name,email,email_verified,role) VALUES($1,'Reuse test',$2,true,$3)",
      [a.id, `${a.id}@test.invalid`, a.role],
    );
  await pool.query(
    "INSERT INTO student_profiles(user_id,username) VALUES($1,$2)",
    [studentId, `reuse_${studentId}`],
  );
});
beforeEach(async () => {
  classId = (await createClass(teacher, { name: "4-A" })).id;
  await pool.query(
    "INSERT INTO classroom_members(class_id,student_id,status) VALUES($1,$2,'active')",
    [classId, studentId],
  );
  contentId = randomUUID();
  oldVersion = randomUUID();
  newVersion = randomUUID();
  await pool.query("INSERT INTO contents(id,owner_id,slug) VALUES($1,$2,$3)", [
    contentId,
    teacher.id,
    contentId,
  ]);
  for (const id of [oldVersion, newVersion])
    await pool.query(
      "INSERT INTO content_versions(id,content_id,sha256,format,state,metadata,scan_report,tracking) VALUES($1,$2,$5,'html','published',$3,$4,true)",
      [
        id,
        contentId,
        { title: "Kesir oyunu" },
        { status: "clean" },
        "a".repeat(64),
      ],
    );
  await pool.query("UPDATE contents SET published_version_id=$2 WHERE id=$1", [
    contentId,
    oldVersion,
  ]);
  source = await createAssignment(teacher, {
    classId,
    contentId,
    title: "Önceki ödev",
    instructions: "Üç tur oynayın.",
    dueAt: "2026-09-01T10:00:00Z",
  });
});
afterAll(async () => {
  await pool.end();
});
it("loads only the reusable fields, including a closed assignment in an archived class", async () => {
  await pool.query("UPDATE assignments SET closed=true WHERE id=$1", [
    source.id,
  ]);
  await pool.query("UPDATE classrooms SET archived=true WHERE id=$1", [
    classId,
  ]);
  expect(await assignmentReuseSeed(teacher, source.id)).toEqual({
    sourceId: source.id,
    title: "Önceki ödev",
    instructions: "Üç tur oynayın.",
    contentId,
    gameAvailable: true,
    gameUpdated: false,
  });
});
it("rejects foreign, missing, malformed sources and non-teachers", async () => {
  for (const [actor, id] of [
    [other, source.id],
    [teacher, randomUUID()],
    [teacher, "bad-id"],
  ] as const)
    await expect(assignmentReuseSeed(actor, id)).rejects.toMatchObject({
      status: 404,
    });
  await expect(
    assignmentReuseSeed({ id: studentId, role: "student" }, source.id),
  ).rejects.toMatchObject({ status: 403 });
});
it("creates a fresh assignment on the current version and leaves prior attempts intact", async () => {
  await pool.query(
    "INSERT INTO game_attempts(student_id,version_id,assignment_id,progress,score,completed_at) VALUES($1,$2,$3,100,72,now())",
    [studentId, oldVersion, source.id],
  );
  const previous = await assignmentReport(teacher, source.id);
  await pool.query("UPDATE contents SET published_version_id=$2 WHERE id=$1", [
    contentId,
    newVersion,
  ]);
  const seed = await assignmentReuseSeed(teacher, source.id);
  expect(seed.gameUpdated).toBe(true);
  const next = await createAssignment(teacher, {
    classId,
    contentId: seed.contentId,
    title: seed.title,
    instructions: seed.instructions,
    studentIds: [studentId],
  });
  expect(next.id).not.toBe(source.id);
  expect(next.version_id).toBe(newVersion);
  expect(next.due_at).toBeNull();
  expect(next.closed).toBe(false);
  expect((await assignmentReport(teacher, next.id)).rows[0]).toMatchObject({
    attempts: 0,
    score: null,
    progress: null,
  });
  expect(await assignmentReport(teacher, source.id)).toEqual(previous);
});
it.each(["revoked", "unpublished", "unclean"])(
  "keeps text but prevents assigning an unavailable game: %s",
  async (reason) => {
    if (reason === "revoked")
      await pool.query(
        "UPDATE content_versions SET revoked_at=now() WHERE id=$1",
        [oldVersion],
      );
    if (reason === "unpublished")
      await pool.query(
        "UPDATE contents SET published_version_id=NULL WHERE id=$1",
        [contentId],
      );
    if (reason === "unclean")
      await pool.query(
        "UPDATE content_versions SET scan_report=$2 WHERE id=$1",
        [oldVersion, { status: "infected" }],
      );
    expect(await assignmentReuseSeed(teacher, source.id)).toMatchObject({
      gameAvailable: false,
      gameUpdated: false,
      title: "Önceki ödev",
      instructions: "Üç tur oynayın.",
    });
    expect(
      (await teacherDashboard(teacher)).games.some((g) => g.id === contentId),
    ).toBe(false);
    await expect(
      createAssignment(teacher, { classId, contentId, title: "Yeni" }),
    ).rejects.toMatchObject({ status: 400 });
  },
);
it("revalidates the target class and recipients at submission", async () => {
  await assignmentReuseSeed(teacher, source.id);
  await pool.query(
    "UPDATE classroom_members SET status='removed' WHERE class_id=$1",
    [classId],
  );
  await expect(
    createAssignment(teacher, {
      classId,
      contentId,
      title: "Yeni",
      studentIds: [studentId],
    }),
  ).rejects.toMatchObject({ status: 400 });
  await pool.query("UPDATE classrooms SET archived=true WHERE id=$1", [
    classId,
  ]);
  await expect(
    createAssignment(teacher, { classId, contentId, title: "Yeni" }),
  ).rejects.toMatchObject({ status: 409 });
  expect(
    (
      await pool.query("SELECT id FROM assignments WHERE class_id=$1", [
        classId,
      ])
    ).rows,
  ).toHaveLength(1);
});
