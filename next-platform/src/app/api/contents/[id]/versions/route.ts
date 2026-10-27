import { rolesFor } from "@/lib/permissions";
import { api, fail } from "@/server/errors";
import { actor, origin, limit } from "@/server/access";
import { owned, addVersion, metadataSchema } from "@/modules/content";
import { receiveUpload } from "@/modules/upload";
import { filePath } from "@/modules/storage";
import { rm } from "node:fs/promises";
import { requireUploads } from "@/server/demo-deployment";
export const POST = api(async (r, c) => {
  origin(r);
  requireUploads();
  const a = await actor(r.headers, rolesFor("create"));
  await limit("upload:" + a.id, 10);
  const { id } = await c.params;
  const content = await owned(id, a);
  if (content.ownerId !== a.id)
    fail(403, "Yalnızca içerik sahibi yükleyebilir.");
  const versionId = crypto.randomUUID();
  try {
    const upload = await receiveUpload(r, versionId);
    const parsed = metadataSchema.partial().safeParse(upload.metadata);
    if (!parsed.success) fail(400, "Taslak bilgileri geçersiz.");
    await addVersion(
      id,
      a.id,
      versionId,
      upload.sha256,
      upload.format,
      parsed.data,
      upload.originalFilename,
    );
    return Response.json({ versionId }, { status: 202 });
  } catch (e) {
    await rm(filePath("quarantine", versionId), { force: true });
    throw e;
  }
});
