import { api, fail } from "@/server/errors";
import { actor } from "@/server/access";
import { db } from "@/server/db";
import { versions } from "@/server/schema";
import { eq } from "drizzle-orm";
import { owned } from "@/modules/content";
import { filePath } from "@/modules/storage";
import { readFile } from "node:fs/promises";
export const GET=api(async(r,c)=>{
  const a=await actor(r.headers);const v=await db.query.versions.findFirst({where:eq(versions.id,(await c.params).id)});
  if(!v) fail(404,"Sürüm bulunamadı.");await owned(v.contentId,a);
  if(!v.cover?.artifact) fail(404,"Kapak henüz hazır değil.");
  const bytes=await readFile(filePath("thumbnails",v.cover.artifact.id+"/small.webp"));
  return new Response(bytes,{headers:{"Content-Type":"image/webp","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
});
