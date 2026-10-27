import { coverMetadataKey, verifyCover } from "./covers";
import {
  TECHNICAL_RULES_VERSION,
  type CoverState,
  type CoverSelection,
  type ReviewSnapshot,
} from "./review-types";
import { validateAssessment } from "./assessment";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db, transaction } from "../server/db";
import {
  contents,
  versions,
  taxonomy,
  grades,
  decisions,
  audit,
  type Metadata,
} from "../server/schema";
import { fail } from "../server/errors";
import { requireUploads } from "../server/demo-deployment";
import { enqueue } from "../server/queue";
import { validateCurriculumMetadata } from "./curriculum";
import { metadataSchema } from "../lib/metadata-schema";
export { metadataSchema } from "../lib/metadata-schema";
// A saved draft may contain incomplete text. Only submission imposes the
// publication requirements; keeping empty strings preserves deliberate edits.
const draftMetadataSchema = metadataSchema.partial().extend({
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().max(3000).optional(),
});
export async function validateMetadata(data: unknown): Promise<Metadata> {
  const r = metadataSchema.safeParse(data);
  if (!r.success)
    fail(400, "Başlık, açıklama, sınıf ve ders bilgilerini kontrol edin.");
  const m = r.data;
  const grade = await db.query.grades.findFirst({
    where: and(eq(grades.value, m.grade), eq(grades.active, true)),
  });
  if (!grade)
    fail(400, "Bu sınıf yeni yüklemelere kapalı. Etkin bir sınıf seçin.");
  const subject = await db.query.taxonomy.findFirst({
    where: and(
      eq(taxonomy.id, m.subjectId),
      eq(taxonomy.kind, "subject"),
      eq(taxonomy.active, true),
    ),
  });
  if (!subject) fail(400, "Geçerli bir ders seçin.");
  for (const id of m.outcomeIds) {
    const outcome = await db.query.taxonomy.findFirst({
      where: and(
        eq(taxonomy.id, id),
        eq(taxonomy.kind, "outcome"),
        eq(taxonomy.parentId, m.subjectId),
        eq(taxonomy.active, true),
      ),
    });
    if (!outcome) fail(400, "Kazanım seçilen derse ait değil.");
  }
  if (
    new Set(m.outcomeRefs.map((r) => r.catalogId + ":" + r.outcomeId)).size !==
    m.outcomeRefs.length
  )
    fail(400, "Kazanım tekrarlanamaz.");
  await validateCurriculumMetadata(m);
  return m;
}
export async function createContent(ownerId: string, title = "Yeni oyun") {
  requireUploads();
  const slug =
    title
      .toLocaleLowerCase("tr")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ı/g, "i")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) +
    "-" +
    crypto.randomUUID().slice(0, 8);
  return (await db.insert(contents).values({ ownerId, slug }).returning())[0];
}
export async function owned(id: string, actor: { id: string; role: string }) {
  const c = await db.query.contents.findFirst({ where: eq(contents.id, id) });
  if (!c) fail(404, "İçerik bulunamadı.");
  if (c.ownerId !== actor.id && !["editor", "admin"].includes(actor.role))
    fail(403, "Bu içeriğe erişim yetkiniz yok.");
  return c;
}
export async function addVersion(
  id: string,
  ownerId: string,
  versionId: string,
  sha256: string,
  format: string,
  metadata: Partial<Metadata> = {},
  originalFilename?: string,
  sourceVersionId?: string,
  coverSelection?: CoverSelection,
) {
  requireUploads();
  return transaction(async (tx, client) => {
    const [c] = await tx
      .select()
      .from(contents)
      .where(eq(contents.id, id))
      .for("update");
    if (!c || c.ownerId !== ownerId)
      fail(403, "İçeriği yalnızca sahibi güncelleyebilir.");
    if (sourceVersionId) {
      if (c.publishedVersionId !== sourceVersionId)
        fail(409, "Yayımdaki sürüm değişti.");
      if (c.draftVersionId && c.draftVersionId !== sourceVersionId) {
        const [draft] = await tx
          .select()
          .from(versions)
          .where(eq(versions.id, c.draftVersionId));
        if (
          draft &&
          !["rejected", "revision_requested", "superseded"].includes(
            draft.state,
          )
        )
          fail(409, "Önce mevcut taslağınızı tamamlayın.");
      }
    }
    await tx.insert(versions).values({
      id: versionId,
      contentId: id,
      sha256,
      format,
      metadata: {
        title: "Yeni oyun",
        description: "",
        grade: 0,
        subjectId: "",
        outcomeIds: [],
      },
      draftMetadata: metadata,
      originalFilename,
      ...(coverSelection
        ? {
            cover: {
              revision: 0,
              selection: coverSelection,
              status: "pending" as const,
            },
          }
        : {}),
    });
    await tx
      .update(contents)
      .set({ draftVersionId: versionId, updatedAt: new Date() })
      .where(eq(contents.id, id));
    const jobId = await enqueue("scan", versionId, sha256, client);
    await tx.update(versions).set({ jobId }).where(eq(versions.id, versionId));
    await tx.insert(audit).values({
      actorId: ownerId,
      action: "version.uploaded",
      targetId: versionId,
    });
    return versionId;
  });
}
export async function decide(
  versionId: string,
  sha: string,
  actorId: string,
  decision: "approve" | "revise",
  note: string,
  expectedRevision?: number,
  excludedOutcomeIds: string[] = [],
  review?: { technicalReportId: string; coverId: string; assessment: unknown },
) {
  await transaction(async (tx, client) => {
    const [v] = await tx
      .select()
      .from(versions)
      .where(eq(versions.id, versionId))
      .for("update");
    if (!v) fail(404, "Sürüm bulunamadı.");
    const [c] = await tx
      .select()
      .from(contents)
      .where(eq(contents.id, v.contentId))
      .for("update");
    if (
      c.draftVersionId !== versionId ||
      v.sha256 !== sha ||
      v.state !== "review" ||
      !v.metadataConfirmedAt ||
      !Number.isInteger(expectedRevision) ||
      v.metadataRevision !== expectedRevision ||
      v.scanReport?.status !== "clean"
    )
      fail(
        409,
        "Sürüm değişti veya incelemeye hazır değil. Sayfayı yenileyin.",
      );
    if (
      !review ||
      v.technicalReport?.status !== "complete" ||
      v.technicalReport.rulesVersion !== TECHNICAL_RULES_VERSION ||
      v.technicalReport.sha256 !== sha ||
      v.technicalReport.entrypoint !== v.entrypoint ||
      v.cover?.status !== "ready" ||
      !v.cover.artifact ||
      review.technicalReportId !== v.technicalReport.id ||
      review.coverId !== v.cover.artifact.id
    )
      fail(409, "Teknik rapor veya kapak değişti; güncel incelemeyi açın.");
    let assessment;
    try {
      assessment = validateAssessment(
        review.assessment,
        v.technicalReport,
        v.metadata.outcomeRefs ?? [],
        decision === "approve",
        excludedOutcomeIds,
      );
    } catch (e) {
      fail(
        400,
        e instanceof Error ? e.message : "İnceleme formunu tamamlayın.",
      );
    }
    const snapshot: ReviewSnapshot = {
      technicalReportId: review.technicalReportId,
      coverId: review.coverId,
      metadataRevision: v.metadataRevision,
      assessment,
    };
    if (decision === "approve") {
      await verifyCover(v.cover.artifact);
      const refs = v.metadata.outcomeRefs ?? [];
      if (
        excludedOutcomeIds.some((id) => !refs.some((r) => r.outcomeId === id))
      )
        fail(400, "Çıkarılacak kazanım sürüme ait değil.");
      for (const ref of refs.filter(
        (r) => !excludedOutcomeIds.includes(r.outcomeId),
      )) {
        const result = (
          await client.query(
            `SELECT 1 FROM curriculum_outcomes o JOIN curriculum_reviews r ON r.catalog_id=o.catalog_id AND r.outcome_id=o.id AND r.fingerprint=o.fingerprint WHERE o.catalog_id=$1 AND o.id=$2 LIMIT 1`,
            [ref.catalogId, ref.outcomeId],
          )
        ).rowCount;
        if (!result)
          fail(
            409,
            "Kazanımın kaynak doğrulaması gerekli; doğrulayın veya gerekçeyle ilişkiyi çıkarın.",
          );
      }
    }
    await tx
      .insert(decisions)
      .values({ versionId, sha256: sha, actorId, decision, note, snapshot });
    await tx
      .update(versions)
      .set({
        reviewSnapshot: snapshot,
        excludedOutcomeIds: decision === "approve" ? excludedOutcomeIds : [],
        state: decision === "approve" ? "publishing" : "revision_requested",
        reviewNote: note,
        error: null,
        updatedAt: new Date(),
      })
      .where(eq(versions.id, versionId));
    if (decision === "approve") {
      const jobId = await enqueue("publish", versionId, sha, client);
      await tx
        .update(versions)
        .set({ jobId })
        .where(eq(versions.id, versionId));
    }
    await tx.insert(audit).values({
      actorId,
      action: `review.${decision}`,
      targetId: versionId,
      details: {
        sha256: sha,
        metadataRevision: v.metadataRevision,
        excludedOutcomeIds,
      },
    });
  });
}
export async function saveMetadata(
  versionId: string,
  ownerId: string,
  sha256: string,
  expectedRevision: number,
  data: unknown,
  submit = false,
) {
  const parsed = draftMetadataSchema.safeParse(data);
  if (!parsed.success) fail(400, "Bilgilerin biçimini kontrol edin.");
  return transaction(async (tx, client) => {
    const [v] = await tx
      .select()
      .from(versions)
      .where(eq(versions.id, versionId))
      .for("update");
    if (!v) fail(404, "Sürüm bulunamadı.");
    const [c] = await tx
      .select()
      .from(contents)
      .where(eq(contents.id, v.contentId))
      .for("update");
    if (c.ownerId !== ownerId) fail(403, "İçerik sahibi olmalısınız.");
    if (
      c.draftVersionId !== v.id ||
      v.sha256 !== sha256 ||
      v.metadataRevision !== expectedRevision ||
      v.state !== "needs_metadata" ||
      v.metadataConfirmedAt ||
      v.scanReport?.status !== "clean" ||
      !v.entrypoint
    )
      fail(409, "Taslak değişti veya bilgileri düzenlemeye hazır değil.");
    const metadata = submit ? await validateMetadata(parsed.data) : undefined;
    const key = coverMetadataKey(parsed.data);
    let cover = v.cover;
    const needsCover =
      !cover ||
      cover.selection.mode === "auto" ||
      cover.selection.mode === "generated";
    const changed =
      needsCover && (!cover?.artifact || cover.artifact.metadataKey !== key);
    if (submit) {
      if (
        v.technicalReport?.status !== "complete" ||
        v.technicalReport.rulesVersion !== TECHNICAL_RULES_VERSION ||
        v.technicalReport.sha256 !== sha256 ||
        v.technicalReport.entrypoint !== v.entrypoint
      )
        fail(409, "Güncel teknik kontroller tamamlanmalı.");
      if (!cover?.artifact || cover.status !== "ready" || changed)
        fail(
          409,
          "Bilgileri önce taslak olarak kaydedin; güncel kapak hazırlandıktan sonra incelemeye gönderin.",
        );
      await verifyCover(cover.artifact);
    } else if (changed) {
      cover = {
        revision: (cover?.revision ?? 0) + 1,
        selection: cover?.selection ?? { mode: "auto" },
        status: "pending",
        artifact: cover?.artifact,
      };
      await enqueue("render-cover", v.id, sha256, client, {
        coverRevision: cover.revision,
      });
    }
    await tx
      .update(versions)
      .set({
        cover,
        draftMetadata: parsed.data,
        metadataRevision: v.metadataRevision + 1,
        ...(metadata
          ? { metadata, state: "review", metadataConfirmedAt: new Date() }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(versions.id, v.id));
    await tx.insert(audit).values({
      actorId: ownerId,
      action: submit ? "metadata.submitted" : "metadata.saved",
      targetId: v.id,
      details: { sha256, metadataRevision: v.metadataRevision + 1 },
    });
    return {
      revision: v.metadataRevision + 1,
      state: submit ? "review" : "needs_metadata",
    };
  });
}
export async function unpublish(id: string, actorId: string) {
  await transaction(async (tx) => {
    await tx
      .update(contents)
      .set({ publishedVersionId: null, updatedAt: new Date() })
      .where(eq(contents.id, id));
    await tx
      .update(versions)
      .set({
        state: "revision_requested",
        reviewNote: "Admin yayın işlemini iptal etti.",
      })
      .where(
        and(
          eq(versions.contentId, id),
          sql`${versions.state} IN ('publishing','publish_error')`,
        ),
      );
    await tx
      .update(versions)
      .set({ revokedAt: new Date() })
      .where(eq(versions.contentId, id));
    await tx
      .insert(audit)
      .values({ actorId, action: "content.unpublished", targetId: id });
  });
}
export async function catalog(
  filters: { q?: string; grade?: string; subject?: string } = {},
) {
  const conditions = [sql`${contents.publishedVersionId} = ${versions.id}`];
  if (filters.grade && /^\d+$/.test(filters.grade))
    conditions.push(
      sql`(${versions.metadata}->>'grade')::integer = ${Number(filters.grade)}`,
    );
  if (filters.subject && z.uuid().safeParse(filters.subject).success)
    conditions.push(
      sql`${versions.metadata}->>'subjectId' = ${filters.subject}`,
    );
  if (filters.q?.trim()) {
    const q = filters.q.trim().slice(0, 120);
    conditions.push(
      sql`(to_tsvector('turkish', ${versions.metadata}->>'title' || ' ' || (${versions.metadata}->>'description')) @@ plainto_tsquery('turkish', ${q}) OR lower(${versions.metadata}->>'title') LIKE lower(${"%" + q.replace(/[\\%_]/g, "\\$&") + "%"}) OR similarity(${versions.metadata}->>'title',${q}) > 0.2)`,
    );
  }
  return db
    .select({ content: contents, version: versions, subject: taxonomy.label })
    .from(contents)
    .innerJoin(versions, and(...conditions))
    .leftJoin(
      taxonomy,
      sql`${taxonomy.id}::text = ${versions.metadata}->>'subjectId'`,
    )
    .orderBy(desc(contents.updatedAt))
    .limit(60);
}
export const stateLabel: Record<string, string> = {
  queued: "Sırada",
  scanning: "Güvenlik taraması",
  scan_error: "Tarama yeniden denenecek",
  rejected: "Paket kabul edilmedi",
  needs_entry: "Giriş dosyası seçin",
  extracting: "Oyun bilgileri çıkarılıyor",
  needs_metadata: "Bilgileri kontrol edin",
  review: "Yönetici incelemesinde",
  revision_requested: "Düzeltme istendi",
  publishing: "Yayın hazırlanıyor",
  publish_error: "Yayın yeniden denenecek",
  published: "Yayımlandı",
  superseded: "Yeni sürümle değiştirildi",
};
