import { rolesFor } from "@/lib/permissions";
import { api, fail } from "@/server/errors";
import { actor, origin, limit } from "@/server/access";
import { decide } from "@/modules/content";
export const POST = api(async (r, c) => {
  origin(r);
  const a = await actor(r.headers, rolesFor("review"));
  await limit("decision:" + a.id, 60);
  const { id } = await c.params;
  const {
    review,
    sha256,
    decision,
    note,
    revision,
    excludedOutcomeIds = [],
  } = await r.json();
  if (
    !["approve", "revise"].includes(decision) ||
    typeof sha256 !== "string" ||
    typeof note !== "string" ||
    note.trim().length < 5 ||
    note.length > 3000 ||
    !Number.isInteger(revision) ||
    revision < 0 ||
    !Array.isArray(excludedOutcomeIds) ||
    excludedOutcomeIds.length > 20 ||
    excludedOutcomeIds.some((s: unknown) => typeof s !== "string")
  )
    fail(400, "Karar ve en az 5 karakterlik gerekçe gerekli.");
  await decide(id, sha256, a.id, decision, note, revision, excludedOutcomeIds, review);
  return Response.json({ ok: true });
});
