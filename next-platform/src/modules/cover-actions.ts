import { eq } from "drizzle-orm";
import { z } from "zod";
import { transaction } from "../server/db";
import { versions, contents, audit } from "../server/schema";
import { enqueue } from "../server/queue";
import { fail } from "../server/errors";
import { coverCandidates } from "./covers";
import type { CoverSelection, CoverState } from "./review-types";
export const selectionSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("auto") }).strict(),
  z.object({ mode: z.literal("generated") }).strict(),
  z
    .object({ mode: z.literal("package"), path: z.string().min(1).max(250) })
    .strict(),
]);
export const coverEditable = [
  "queued",
  "scanning",
  "scan_error",
  "extracting",
  "needs_metadata",
  "needs_entry",
];
export async function selectCover(
  id: string,
  ownerId: string,
  sha256: string,
  revision: number,
  coverRevision: number,
  selection: CoverSelection,
) {
  return transaction(async (tx, client) => {
    const [v] = await tx
      .select()
      .from(versions)
      .where(eq(versions.id, id))
      .for("update");
    if (!v) fail(404, "Sürüm bulunamadı.");
    const [c] = await tx
      .select()
      .from(contents)
      .where(eq(contents.id, v.contentId))
      .for("update");
    if (c.ownerId !== ownerId) fail(403, "İçerik sahibi olmalısınız.");
    if (
      c.draftVersionId !== id ||
      v.sha256 !== sha256 ||
      v.metadataRevision !== revision ||
      (v.cover?.revision ?? 0) !== coverRevision ||
      !coverEditable.includes(v.state) ||
      v.metadataConfirmedAt
    )
      fail(409, "Kapak veya taslak değişti. Sayfayı yenileyin.");
    if (
      selection.mode === "package" &&
      (v.scanReport?.status !== "clean" ||
        !coverCandidates(v.manifest).includes(selection.path))
    )
      fail(400, "Taramadan geçmiş paketten bir görsel seçin.");
    const cover: CoverState = {
      revision: coverRevision + 1,
      selection,
      status: "pending",
      artifact: v.cover?.artifact,
    };
    await tx
      .update(versions)
      .set({ cover, updatedAt: new Date() })
      .where(eq(versions.id, id));
    if (v.scanReport?.status === "clean" && v.entrypoint)
      await enqueue("render-cover", id, sha256, client, {
        coverRevision: cover.revision,
      });
    await tx
      .insert(audit)
      .values({
        actorId: ownerId,
        action: "cover.selected",
        targetId: id,
        details: { mode: selection.mode, coverRevision: cover.revision },
      });
    return { cover };
  });
}
