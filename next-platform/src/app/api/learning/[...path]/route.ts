import { api, fail } from "@/server/errors";
import { actor, origin, limit } from "@/server/access";
import { requireLearning } from "@/server/learning-feature";
import { z } from "zod";
import {
  parsed,
  boundedBody,
  createClass,
  changeClass,
  joinClass,
  createAssignment,
  changeAssignment,
  issueRecovery,
  startGame,
  saveGame,
  studentDashboard,
  teacherDashboard,
  assignmentReport,
} from "@/modules/learning";
const roles = ["student", "teacher", "editor", "admin"];
export const GET = api(async (r, c) => {
  requireLearning();
  const a = await actor(r.headers, roles);
  const path = (await c.params).path as string[];
  const key = path.join("/");
  let data;
  if (key === "student") data = await studentDashboard(a);
  else if (key === "teacher") data = await teacherDashboard(a);
  else if (
    path.length === 3 &&
    path[0] === "assignments" &&
    path[2] === "report"
  )
    data = await assignmentReport(a, path[1]);
  else fail(404, "Bulunamadı.");
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
});
export const POST = api(async (r, c) => {
  requireLearning();
  origin(r);
  const a = await actor(r.headers, roles);
  const path = (await c.params).path as string[];
  const key = path.join("/");
  await limit("learning:" + a.id, 600, 60);
  const b = await boundedBody(r);
  let data;
  if (key === "classes") data = await createClass(a, b);
  else if (key === "join") {
    await limit("class-join:" + a.id, 20, 900);
    data = await joinClass(a, b);
  } else if (path.length === 2 && path[0] === "classes")
    data = await changeClass(a, path[1], b);
  else if (key === "assignments") data = await createAssignment(a, b);
  else if (path.length === 2 && path[0] === "assignments")
    data = await changeAssignment(a, path[1], b);
  else if (path.length === 2 && path[0] === "recovery") {
    await limit("recovery:" + a.id, 30);
    const recovery = parsed(
      z.object({ takeover: z.boolean().default(false) }),
      b,
    );
    data = await issueRecovery(a, path[1], recovery.takeover);
  } else if (key === "play") data = await startGame(a, b);
  else if (path.length === 2 && path[0] === "play")
    data = await saveGame(a, path[1], b);
  else fail(404, "Bulunamadı.");
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
});
