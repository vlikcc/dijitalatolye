import { rolesFor } from "@/lib/permissions";
import { api, fail } from "@/server/errors";
import { actor, origin, limit } from "@/server/access";
import { transaction } from "@/server/db";
import { versions, contents, audit } from "@/server/schema";
import { eq } from "drizzle-orm";
import { enqueue } from "@/server/queue";
export const POST = api(async (r, c) => {
  origin(r);
  const a = await actor(r.headers, rolesFor("administer"));
  await limit("job-retry:"+a.id,30);
  const { id } = await c.params;
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
    if (content.draftVersionId !== id)
      fail(409, "Bu sürüm artık güncel değil.");
    if(v.state === "needs_metadata" && v.cover?.status === "error") {
      const cover={...v.cover,revision:v.cover.revision+1,status:"pending" as const,error:undefined};
      const jobId=await enqueue("render-cover",id,v.sha256,client,{coverRevision:cover.revision});
      await tx.update(versions).set({cover,jobId}).where(eq(versions.id,id));
      await tx.insert(audit).values({actorId:a.id,action:"cover.retried",targetId:id});
      return;
    }
    if (!["scan_error", "publish_error", "extracting"].includes(v.state))
      fail(409, "Bu iş yeniden denenemez.");
    const jobId = await enqueue(
      v.state === "scan_error"
        ? "scan"
        : v.state === "publish_error"
          ? "publish"
          : "extract-metadata",
      id,
      v.sha256,
      client,
    );
    await tx
      .update(versions)
      .set({ jobId, error: null })
      .where(eq(versions.id, id));
    await tx
      .insert(audit)
      .values({ actorId: a.id, action: "job.retried", targetId: id });
  });
  return Response.json({ ok: true });
});
