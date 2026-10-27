import { rolesFor } from "@/lib/permissions";
import { api, fail } from "@/server/errors";
import { actor, origin, limit } from "@/server/access";
import { createContent } from "@/modules/content";
export const POST = api(async (r) => {
  origin(r);
  const a = await actor(r.headers, rolesFor("create"));
  await limit("create:" + a.id);
  const { title } = await r.json();
  if (
    title !== undefined &&
    (typeof title !== "string" || title.length < 3 || title.length > 120)
  )
    fail(400, "Başlık 3–120 karakter olmalı.");
  return Response.json(await createContent(a.id, title), { status: 201 });
});
