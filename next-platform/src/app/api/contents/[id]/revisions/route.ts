import { rolesFor } from "@/lib/permissions";
import { api, fail } from "@/server/errors";
import { actor,origin,limit } from "@/server/access";
import { db } from "@/server/db";
import { versions } from "@/server/schema";
import { eq } from "drizzle-orm";
import { owned,addVersion } from "@/modules/content";
import { initStorage,filePath,hashFile } from "@/modules/storage";
import { copyFile,rm } from "node:fs/promises";
import { constants } from "node:fs";
export const POST=api(async(r,c)=>{
  origin(r);const a=await actor(r.headers, rolesFor("create"));await limit("revision:"+a.id,10);
  const content=await owned((await c.params).id,a);
  if(content.ownerId!==a.id || !content.publishedVersionId) fail(403,"Yayımdaki kendi içeriğinizden taslak oluşturabilirsiniz.");
  const {sourceVersionId}=await r.json();
  if(sourceVersionId!==content.publishedVersionId) fail(409,"Yayımdaki sürüm değişti.");
  const source=await db.query.versions.findFirst({where:eq(versions.id,sourceVersionId)});
  if(!source) fail(404,"Kaynak sürüm bulunamadı.");
  await initStorage();const id=crypto.randomUUID(),target=filePath("quarantine",id);
  try {
    await copyFile(filePath("quarantine",source.id),target,constants.COPYFILE_EXCL);
    if(await hashFile(target)!==source.sha256) fail(409,"Kaynak paket bütünlüğü doğrulanamadı; oyunu yeniden yükleyin.");
    await addVersion(content.id,a.id,id,source.sha256,source.format,source.metadata,source.originalFilename??undefined,source.id,source.cover?.selection);
    return Response.json({versionId:id,contentId:content.id},{status:202});
  } catch(e) {await rm(target,{force:true});throw e;}
});
