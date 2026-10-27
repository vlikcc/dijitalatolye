import { rolesFor } from "@/lib/permissions";
import { api, fail, AppError } from "@/server/errors";
import { actor, origin, limit } from "@/server/access";
import { db } from "@/server/db";
import { versions } from "@/server/schema";
import { eq } from "drizzle-orm";
import { owned } from "@/modules/content";
import { filePath, initStorage, hashFile } from "@/modules/storage";
import { selectCover } from "@/modules/cover-actions";
import { mkdir, rm } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
export const POST = api(async (r, c) => {
  origin(r); const a = await actor(r.headers, rolesFor("create")); await limit("thumbnail:" + a.id, 20);
  const v=await db.query.versions.findFirst({where:eq(versions.id,(await c.params).id)});
  if(!v) fail(404,"Sürüm bulunamadı.");
  const content=await owned(v.contentId,a);
  if(content.ownerId!==a.id) fail(403,"İçerik sahibi olmalısınız.");
  const revision=Number(r.headers.get("X-Metadata-Revision")),coverRevision=Number(r.headers.get("X-Cover-Revision"));
  const sha256=r.headers.get("X-Package-Sha256");
  if(!r.body || !sha256 || !r.headers.has("X-Metadata-Revision") || !r.headers.has("X-Cover-Revision") || !Number.isInteger(revision) || !Number.isInteger(coverRevision)) fail(400,"Görsel ve güncel revizyon bilgileri gerekli.");
  await initStorage();const inputId=crypto.randomUUID(),dir=filePath("cover-inputs",inputId),target=dir+"/input";await mkdir(dir,{mode:0o700});
  try {
    let size=0;
    await pipeline(Readable.fromWeb(r.body as any),new Transform({transform(chunk,_enc,cb){size+=chunk.length;if(size>5*1024*1024)cb(new AppError(400,"Görsel 5 MB sınırını aşıyor."));else cb(null,chunk);}}),createWriteStream(target,{flags:"wx",mode:0o600}));
    if(!size) fail(400,"Görsel boş.");
    const result=await selectCover(v.id,a.id,sha256,revision,coverRevision,{mode:"upload",inputId,sha256:await hashFile(target)});
    return Response.json(result,{status:202});
  }catch(e){await rm(dir,{recursive:true,force:true});throw e;}
});
