import { db } from "@/server/db";
import { versions, contents } from "@/server/schema";
import { eq } from "drizzle-orm";
import { filePath } from "@/modules/storage";
import { readFile } from "node:fs/promises";
export const dynamic = "force-dynamic";
export async function GET(_r: Request, c: { params: Promise<{ id: string }> }) {
  const { id } = await c.params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new Response(null, { status: 404 });
  const v = await db.query.versions.findFirst({ where: eq(versions.id, id) });
  if (!v?.thumbnail) return new Response(null, { status: 404 });
  const content = await db.query.contents.findFirst({
    where: eq(contents.id, v.contentId),
  });
  if (content?.publishedVersionId !== id)
    return new Response(null, { status: 404 });
  try {
    return new Response(
      new Uint8Array(await readFile(filePath("thumbnails", v.cover?.artifact ? `${v.cover.artifact.id}/small.webp` : id + ".webp"))),
      {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch {
    return new Response(null, { status: 404 });
  }
}
