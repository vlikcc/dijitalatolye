import { api, fail } from "@/server/errors";
import { actor, origin, limit } from "@/server/access";
import { db } from "@/server/db";
import { versions } from "@/server/schema";
import { eq } from "drizzle-orm";
import { owned } from "@/modules/content";
import { previewToken, gameUrl } from "@/modules/game-access";
export const POST = api(async (r, c) => {
  origin(r);
  const a = await actor(r.headers);
  await limit("preview:" + a.id, 60);
  const { id } = await c.params;
  const v = await db.query.versions.findFirst({ where: eq(versions.id, id) });
  if (!v) fail(404, "Sürüm bulunamadı.");
  await owned(v.contentId, a);
  if (v.scanReport?.status !== "clean" || !v.entrypoint)
    fail(
      409,
      "Önizleme için taramanın tamamlanması ve giriş dosyasının seçilmesi gerekiyor.",
    );
  return Response.json(
    {
      url: gameUrl(v.id, v.entrypoint, await previewToken(v.id, v.sha256)),
      expiresIn: 900,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
});
