import { api, fail } from "@/server/errors";
import { actor } from "@/server/access";
import { db } from "@/server/db";
import { versions } from "@/server/schema";
import { eq } from "drizzle-orm";
import { owned } from "@/modules/content";
export const GET=api(async(r,c)=>{
  const a=await actor(r.headers);const v=await db.query.versions.findFirst({where:eq(versions.id,(await c.params).id)});
  if(!v) fail(404,"Sürüm bulunamadı.");await owned(v.contentId,a);
  return Response.json({report:v.technicalReport},{headers:{"Cache-Control":"private, no-store"}});
});
