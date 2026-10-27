import { beforeAll, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { pool } from "../../src/server/db";
import {
  teacherContents,
  reviewQueue,
} from "../../src/modules/workspace-lists";
import { teacherDashboard } from "../../src/modules/learning";
const teacher = { id: randomUUID(), role: "teacher" },
  other = { id: randomUUID(), role: "teacher" },
  editor = { role: "editor" };
const marker = `Workspace ${randomUUID().slice(0, 8)}`;
let subject: string, special: string, oldPublished: string;
beforeAll(async () => {
  if (!new URL(process.env.DATABASE_URL!).pathname.endsWith("_test"))
    throw Error("Dedicated test database required");
  process.env.STUDENT_LEARNING_ENABLED = "true";
  for (const a of [teacher, other])
    await pool.query(
      "INSERT INTO users(id,name,email,email_verified,role) VALUES($1,'Workspace teacher',$2,true,'teacher')",
      [a.id, `${a.id}@example.test`],
    );
  subject = (
    await pool.query(
      "INSERT INTO taxonomy(kind,label) VALUES('subject',$1) RETURNING id",
      [marker],
    )
  ).rows[0].id;
  for (let i = 0; i < 52; i++) {
    const c = randomUUID(),
      v = randomUUID();
    await pool.query(
      "INSERT INTO contents(id,owner_id,slug) VALUES($1,$2,$3)",
      [c, teacher.id, c],
    );
    await pool.query(
      "INSERT INTO content_versions(id,content_id,sha256,format,state,metadata,metadata_confirmed_at) VALUES($1,$2,$3,'html','review',$4,now())",
      [
        v,
        c,
        "b".repeat(64),
        JSON.stringify({
          title: `${marker} ${String(i).padStart(2, "0")}`,
          grade: i % 2 ? 4 : 5,
          subjectId: subject,
        }),
      ],
    );
    await pool.query("UPDATE contents SET draft_version_id=$2 WHERE id=$1", [
      c,
      v,
    ]);
    if (i === 0) {
      special = c;
      oldPublished = randomUUID();
      await pool.query(
        "INSERT INTO content_versions(id,content_id,sha256,format,state,metadata,tracking) VALUES($1,$2,$3,'html','published',$4,true)",
        [
          oldPublished,
          c,
          "c".repeat(64),
          JSON.stringify({
            title: marker + " previous",
            grade: 4,
            subjectId: subject,
          }),
        ],
      );
      await pool.query(
        "UPDATE contents SET published_version_id=$2 WHERE id=$1",
        [c, oldPublished],
      );
      await pool.query(
        "UPDATE content_versions SET state='revision_requested' WHERE id=$1",
        [v],
      );
    }
  }
});
afterAll(async () => pool.end());
it("paginates owned data without leaking other owners or invalid role access", async () => {
  const first = await teacherContents(teacher, { q: marker });
  const second = await teacherContents(teacher, { q: marker, sayfa: "2" });
  expect(first.total).toBe(52);
  expect(first.rows).toHaveLength(25);
  expect(second.rows).toHaveLength(25);
  expect(
    new Set([...first.rows, ...second.rows].map((r) => r.content.id)).size,
  ).toBe(50);
  expect((await teacherContents(other, { q: marker })).total).toBe(0);
  await expect(
    teacherContents({ ...teacher, role: "admin" }, {}),
  ).rejects.toMatchObject({ status: 403 });
  await expect(reviewQueue(teacher, {})).rejects.toMatchObject({ status: 403 });
});
it("shows prior publication and actionable draft in both relevant filters", async () => {
  for (const durum of ["attention", "live"]) {
    const result = await teacherContents(teacher, { q: marker, durum });
    expect(result.total).toBe(1);
    expect(result.rows[0].content.id).toBe(special);
    expect(result.rows[0].version?.state).toBe("revision_requested");
    expect(result.rows[0].publishedVersion?.state).toBe("published");
  }
  expect(
    (await teacherContents(teacher, { q: marker, durum: "review" })).total,
  ).toBe(51);
});
it("filters queue by title, grade and subject and counts only current review versions", async () => {
  const result = await reviewQueue(editor, {
    q: marker,
    sinif: "4",
    ders: subject,
    siralama: "newest",
    sayfa: "999",
  });
  expect(result.total).toBe(26);
  expect(result.page).toBe(2);
  expect(result.rows).toHaveLength(1);
  expect(result.rows[0].v.metadata.grade).toBe(4);
  expect((await reviewQueue(editor, { q: marker, sinif: "12" })).total).toBe(0);
});
it("escapes literal search wildcards and preserves zero-results pagination", async () => {
  const result = await teacherContents(teacher, {
    q: `${marker}%`,
    sayfa: "3",
  });
  expect(result.total).toBe(0);
  expect(result.rows).toEqual([]);
  expect(result.page).toBe(1);
});
it("returns real game metadata and removes revoked publication from live filters", async () => {
  const d = await teacherDashboard(teacher);
  expect(d.games.find((g) => g.id === special)).toMatchObject({
    grade: "4",
    subjectId: subject,
    subject: marker,
    tracking: true,
  });
  await pool.query("UPDATE content_versions SET revoked_at=now() WHERE id=$1", [
    oldPublished,
  ]);
  expect(
    (await teacherContents(teacher, { q: marker, durum: "live" })).total,
  ).toBe(0);
  expect(
    (await teacherDashboard(teacher)).games.some((g) => g.id === special),
  ).toBe(false);
});
