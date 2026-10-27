import { rolesFor } from "@/lib/permissions";
import { api, fail } from "@/server/errors";
import { actor, origin, limit } from "@/server/access";
import { db } from "@/server/db";
import { versions } from "@/server/schema";
import { eq } from "drizzle-orm";
import { owned } from "@/modules/content";
import { coverCandidates } from "@/modules/covers";
import { selectionSchema, selectCover } from "@/modules/cover-actions";
export const GET=api(async(r,c)=>{
  const a=await actor(r.headers), {id}=await c.params;
  const v=await db.query.versions.findFirst({where:eq(versions.id,id)});
  if(!v) fail(404,"Sürüm bulunamadı.");
  await owned(v.contentId,a);
  return Response.json({cover:v.cover,revision:v.metadataRevision,candidates:v.scanReport?.status==="clean"?coverCandidates(v.manifest):[]});
});
export const PUT=api(async(r,c)=>{
  origin(r);const a=await actor(r.headers, rolesFor("create"));await limit("cover:"+a.id,60);
  const b=await r.json();const selection=selectionSchema.safeParse(b.selection);
  if(!selection.success || typeof b.sha256!=="string" || !Number.isInteger(b.revision) || !Number.isInteger(b.coverRevision)) fail(400,"Kapak seçimi veya revizyonu geçersiz.");
  return Response.json(await selectCover((await c.params).id,a.id,b.sha256,b.revision,b.coverRevision,selection.data));
});
