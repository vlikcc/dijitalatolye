import { rolesFor } from "@/lib/permissions";
import { api } from "@/server/errors";
import { actor, origin } from "@/server/access";
import { unpublish } from "@/modules/content";
export const POST = api(async (r, c) => {
  origin(r);
  const a = await actor(r.headers, rolesFor("administer"));
  await unpublish((await c.params).id, a.id);
  return Response.json({ ok: true });
});
