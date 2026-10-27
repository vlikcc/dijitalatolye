import { rolesFor } from "@/lib/permissions";
import { api, fail } from "@/server/errors";
import { actor, origin, limit } from "@/server/access";
import { transaction } from "@/server/db";
import { versions, contents } from "@/server/schema";
import { eq } from "drizzle-orm";
import { enqueue } from "@/server/queue";
export const POST = api(async (r, c) => {
  origin(r);
  const a = await actor(r.headers, rolesFor("create"));
  await limit("entrypoint:" + a.id, 30);
  const { id } = await c.params;
  const { entrypoint } = await r.json();
  await transaction(async (tx, client) => {
    const [v] = await tx
      .select()
      .from(versions)
      .where(eq(versions.id, id))
      .for("update");
    if (!v) fail(404, "Sürüm bulunamadı.");
    const [content] = await tx
      .select()
      .from(contents)
      .where(eq(contents.id, v.contentId));
    if (content.ownerId !== a.id) fail(403, "İçerik sahibi olmalısınız.");
    if (
      content.draftVersionId !== id ||
      v.state !== "needs_entry" ||
      !v.candidates.includes(entrypoint) ||
      v.scanReport?.status !== "clean"
    )
      fail(409, "Giriş dosyası seçilemedi.");
    const jobId = await enqueue("extract-metadata", id, v.sha256, client);
    await tx
      .update(versions)
      .set({ entrypoint, technicalReport:v.technicalReport?{...v.technicalReport,id:crypto.randomUUID(),entrypoint}:null, state: "extracting", jobId })
      .where(eq(versions.id, id));
  });
  return Response.json({ ok: true });
});
