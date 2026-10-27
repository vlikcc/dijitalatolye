import { rolesFor } from "@/lib/permissions";
import { api, fail } from "@/server/errors";
import { actor, origin, limit } from "@/server/access";
import { saveMetadata } from "@/modules/content";
export const POST = api(async (r, c) => {
  origin(r);
  const a = await actor(r.headers, rolesFor("create"));
  await limit("submit:" + a.id, 30);
  const { id } = await c.params;
  const { sha256, revision, metadata } = await r.json();
  if (typeof sha256 !== "string" || !Number.isInteger(revision) || revision < 0)
    fail(400, "Taslak kimliği geçersiz.");
  return Response.json(
    await saveMetadata(id, a.id, sha256, revision, metadata, true),
  );
});
