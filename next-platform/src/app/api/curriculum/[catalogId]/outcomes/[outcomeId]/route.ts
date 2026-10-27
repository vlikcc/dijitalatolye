import { api } from "@/server/errors";
import { actor } from "@/server/access";
import { outcomeEvidence } from "@/modules/curriculum";
export const GET = api(async (r, c) => {
  await actor(r.headers);
  const { catalogId, outcomeId } = await c.params;
  return Response.json(await outcomeEvidence(catalogId, outcomeId), {
    headers: { "Cache-Control": "no-store" },
  });
});
