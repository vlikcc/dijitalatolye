import { api, fail } from "@/server/errors";
import { actor, origin, limit } from "@/server/access";
import { reviewOutcome } from "@/modules/curriculum";
export const POST = api(async (r, c) => {
  origin(r);
  const a = await actor(r.headers, ["editor", "admin"]);
  await limit("verify:" + a.id, 60);
  const { catalogId, outcomeId } = await c.params;
  const { fingerprint, note, confirmed } = await r.json();
  if (
    typeof fingerprint !== "string" ||
    typeof note !== "string" ||
    note.trim().length < 10 ||
    note.length > 3000 ||
    confirmed !== true
  )
    fail(
      400,
      "Kaynak metni, sınıfı ve süreçleri karşılaştırdığınızı onaylayıp not yazın.",
    );
  await reviewOutcome(catalogId, outcomeId, fingerprint, a.id, note);
  return Response.json({ ok: true });
});
