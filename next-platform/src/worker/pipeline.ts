import { validateBundleInChild } from "../modules/bundle-runner";
import {
  TECHNICAL_RULES_VERSION,
  type TechnicalReport,
  type CoverState,
} from "../modules/review-types";
import { renderCover, verifyCover, coverMetadataKey } from "../modules/covers";
import { eq, and, sql } from "drizzle-orm";
import path from "node:path";
import { mkdir, rm, rename } from "node:fs/promises";
import { db, pool, transaction } from "../server/db";
import { versions, contents, audit, taxonomy } from "../server/schema";
import { enqueue } from "../server/queue";
import { extractBundle, validateSources, BundleError } from "../modules/bundle";
import { clamScan, yaraScan, MalwareError, scannerIdentity } from "../modules/scanner";
import {
  hashFile,
  filePath,
  initStorage,
  preparePublication,
  verifyManifest,
} from "../modules/storage";
import { runExtraction } from "../modules/extraction-runner";
import { activeCatalog } from "../modules/curriculum";
import { EXTRACTOR_VERSION } from "../modules/metadata-extract";
export type Payload = {
  versionId: string;
  sha256: string;
  coverRevision?: number;
};
export async function processJob(name: string, data: Payload, retryCount = 0) {
  const lock = await pool.connect();
  await lock.query("SELECT pg_advisory_lock(hashtext($1))", [data.versionId]);
  try {
    const v = await db.query.versions.findFirst({
      where: eq(versions.id, data.versionId),
    });
    if (!v || v.sha256 !== data.sha256) return;
    const c = await db.query.contents.findFirst({
      where: eq(contents.id, v.contentId),
    });
    if (c?.draftVersionId !== v.id) {
      await db
        .update(versions)
        .set({ state: "superseded" })
        .where(and(eq(versions.id, v.id), sqlNotPublished()));
      return;
    }
    if (
      name === "scan" &&
      ["queued", "scanning", "scan_error"].includes(v.state)
    ) {
      await initStorage();
      const temp = filePath("ready", `.tmp-${v.id}-${crypto.randomUUID()}`);
      await db
        .update(versions)
        .set({ state: "scanning", error: null })
        .where(currentVersion(v.id, v.sha256));
      let completedChecks: string[] = [];
      let structure: Awaited<ReturnType<typeof validateSources>> | undefined;
      try {
        if ((await hashFile(filePath("quarantine", v.id))) !== v.sha256)
          throw new BundleError("Paket hash doğrulaması başarısız.");
        await clamScan(filePath("quarantine", v.id));
        const manifest = await extractBundle(
          filePath("quarantine", v.id),
          v.format,
          temp,
        );
        completedChecks.push("malware.archive", "package.structure");
        structure = await validateBundleInChild(
          temp,
          manifest,
          v.draftMetadata.entrypoint,
        );
        for (const f of manifest) await clamScan(path.join(temp, f.path));
        await yaraScan(temp);
        completedChecks.push(
          "resources.static",
          "code.policy",
          "malware.files",
        );
        const checked = structure;
        const scanner = await scannerIdentity();
        const ready = filePath("ready", v.id);
        await rm(ready, { recursive: true, force: true });
        await rename(temp, ready);
        await transaction(async (tx, client) => {
          await tx
            .update(versions)
            .set({
              state: checked.entrypoint ? "extracting" : "needs_entry",
              manifest,
              entrypoint: checked.entrypoint,
              candidates: checked.candidates,
              tracking: checked.tracking,
              technicalReport: {
                id: crypto.randomUUID(),
                versionId: v.id,
                sha256: v.sha256,
                entrypoint: checked.entrypoint,
                rulesVersion: TECHNICAL_RULES_VERSION,
                status: "complete",
                at: new Date().toISOString(),
                filesChecked: manifest.map((f) => f.path),
                completedChecks,
                scanner,
                findings: checked.findings,
                accessibility: checked.accessibility,
                limitations: [
                  "Kod çalıştırılmadı; dinamik davranışların tümü statik olarak belirlenemez.",
                  "Kontrast, klavye akışı, odak ve dinamik ekranlar yönetici tarafından önizlemede incelenmeli.",
                ],
              },
              scanReport: {
                status: "clean",
                engine: "ClamAV + YARA + bundle validator",
                message:
                  "Paket taramadan geçti. Bu sonuç mutlak güvenlik garantisi değildir.",
                at: new Date().toISOString(),
              },
              error: null,
              updatedAt: new Date(),
            })
            .where(currentVersion(v.id, v.sha256));
          if (checked.entrypoint) {
            const jobId = await enqueue(
              "extract-metadata",
              v.id,
              v.sha256,
              client,
            );
            await tx
              .update(versions)
              .set({ jobId })
              .where(currentVersion(v.id, v.sha256));
          }
        });
      } catch (e) {
        const rejected = e instanceof BundleError || e instanceof MalwareError;
        await db
          .update(versions)
          .set({
            technicalReport: {
              id: crypto.randomUUID(),
              versionId: v.id,
              sha256: v.sha256,
              entrypoint: v.entrypoint,
              rulesVersion: TECHNICAL_RULES_VERSION,
              status: rejected ? "blocked" : "error",
              at: new Date().toISOString(),
              completedChecks,
              filesChecked: [],
              accessibility: "unavailable",
              findings: [
                e instanceof BundleError && e.finding
                  ? e.finding
                  : {
                      rule:
                        e instanceof MalwareError
                          ? "malware.detected"
                          : rejected
                            ? "package.invalid"
                            : "scan.unavailable",
                      severity: "blocker",
                      group: e instanceof MalwareError ? "malware" : "package",
                      file: v.originalFilename ?? "Paket",
                      location: "Dosya",
                      evidence: "",
                      message:
                        e instanceof Error
                          ? e.message
                          : "Tarama tamamlanamadı.",
                      remedy: rejected
                        ? "Paketi düzeltip yeni sürüm yükleyin."
                        : "Tarama servisini kontrol edip yeniden deneyin.",
                    },
              ],
              limitations: [
                "İlk engel veya hata nedeniyle kalan kontroller tamamlanmadı.",
              ],
            },
            state: rejected ? "rejected" : "scan_error",
            error: e instanceof Error ? e.message : "Tarama başarısız.",
            scanReport: {
              status: rejected ? "rejected" : "error",
              engine: "ClamAV + YARA + bundle validator",
              message: e instanceof Error ? e.message : "Tarama başarısız.",
              at: new Date().toISOString(),
            },
          })
          .where(currentVersion(v.id, v.sha256));
        if (!rejected) throw e;
      } finally {
        await rm(temp, { recursive: true, force: true });
      }
    }
    if (
      name === "extract-metadata" &&
      v.state === "extracting" &&
      v.entrypoint &&
      v.scanReport?.status === "clean"
    ) {
      const catalog = await activeCatalog();
      let report;
      try {
        await verifyManifest(filePath("ready", v.id), v.manifest);
      } catch {
        await db
          .update(versions)
          .set({
            state: "scan_error",
            error:
              "Taranan dosyaların bütünlüğü değişti; yeniden güvenlik taraması gerekli.",
            scanReport: {
              status: "error",
              engine: "manifest integrity",
              message: "Dosya bütünlüğü doğrulanamadı.",
              at: new Date().toISOString(),
            },
          })
          .where(currentVersion(v.id, v.sha256, "extracting"));
        throw Error("Scanned artifact integrity failure");
      }
      try {
        report = await runExtraction({
          root: filePath("ready", v.id),
          manifest: v.manifest,
          entrypoint: v.entrypoint,
          versionId: v.id,
          sha256: v.sha256,
          catalogId: catalog?.id ?? null,
          originalFilename: v.originalFilename,
        });
      } catch (e) {
        report = {
          status: "error" as const,
          versionId: v.id,
          sha256: v.sha256,
          entrypoint: v.entrypoint,
          extractorVersion: EXTRACTOR_VERSION,
          catalogId: catalog?.id ?? null,
          fields: {},
          codes: [],
          passages: [],
          warnings: [
            e instanceof Error
              ? e.message
              : "Bilgi çıkarımı başarısız. Bilgileri elle tamamlayın.",
          ],
        };
      }
      await transaction(async (tx, client) => {
        const [current] = await tx
          .select()
          .from(versions)
          .where(currentVersion(v.id, v.sha256, "extracting"))
          .for("update");
        if (!current) return;
        const cover: CoverState = {
          revision: (current.cover?.revision ?? 0) + 1,
          selection: current.cover?.selection ?? { mode: "auto" },
          status: "pending",
          artifact: current.cover?.artifact,
        };
        await tx
          .update(versions)
          .set({
            extraction: report,
            state: "needs_metadata",
            cover,
            updatedAt: new Date(),
          })
          .where(currentVersion(v.id, v.sha256, "extracting"));
        await enqueue("render-cover", v.id, v.sha256, client, {
          coverRevision: cover.revision,
        });
      });
    }
    if (
      name === "render-cover" &&
      v.cover &&
      v.cover.revision === data.coverRevision &&
      v.cover.status !== "ready" &&
      ["needs_metadata", "extracting"].includes(v.state) &&
      v.scanReport?.status === "clean"
    ) {
      try {
        try {await verifyManifest(filePath("ready", v.id), v.manifest);}
        catch(e) {
          await db.update(versions).set({state:"scan_error",scanReport:{status:"error",engine:"manifest integrity",message:"Dosya bütünlüğü doğrulanamadı; yeniden tarama gerekli.",at:new Date().toISOString()}}).where(currentVersion(v.id,v.sha256));
          throw e;
        }
        const subject = v.draftMetadata.subjectId
          ? await db.query.taxonomy.findFirst({
              where: eq(taxonomy.id, v.draftMetadata.subjectId),
            })
          : undefined;
        const rendered = await renderCover({
          versionId: v.id,
          selection: v.cover.selection,
          manifest: v.manifest,
          metadata: v.draftMetadata,
          metadataRevision: v.metadataRevision,
          subject: subject?.label ?? "",
        });
        const result = await db
          .update(versions)
          .set({
            cover: {
              ...v.cover,
              ...rendered,
              status: "ready",
              error: undefined,
            },
            thumbnail: true,
            updatedAt: new Date(),
          })
          .where(
            and(
              currentVersion(v.id, v.sha256, "needs_metadata"),
              sql`${versions.cover}->>'revision' = ${String(data.coverRevision)}`,
            ),
          )
          .returning({ id: versions.id });
        if (!result.length)
          await rm(filePath("thumbnails", rendered.artifact.id), {
            recursive: true,
            force: true,
          });
      } catch (e) {
        await db
          .update(versions)
          .set({
            cover: {
              ...v.cover,
              status: "error",
              error: e instanceof Error ? e.message : "Kapak hazırlanamadı.",
            },
          })
          .where(
            and(
              currentVersion(v.id, v.sha256),
              sql`${versions.cover}->>'revision' = ${String(data.coverRevision)}`,
            ),
          );
        throw e;
      }
    }
    if (
      name === "publish" &&
      ["publishing", "publish_error"].includes(v.state)
    ) {
      try {
      if (
        v.scanReport?.status !== "clean" ||
        !v.entrypoint ||
        !v.metadataConfirmedAt ||
        v.technicalReport?.rulesVersion !== TECHNICAL_RULES_VERSION ||
        v.technicalReport.status !== "complete" ||
        v.technicalReport.sha256 !== v.sha256 || v.technicalReport.versionId !== v.id || v.technicalReport.entrypoint !== v.entrypoint ||
        v.cover?.status !== "ready" ||
        !v.cover.artifact ||
        !v.reviewSnapshot ||
        v.reviewSnapshot.coverId !== v.cover.artifact.id ||
        v.reviewSnapshot.technicalReportId !== v.technicalReport.id ||
        v.reviewSnapshot.metadataRevision !== v.metadataRevision
      )
        throw new Error("Yayın güvenlik koşulları sağlanmadı.");
        await verifyCover(v.cover!.artifact!);
        await preparePublication(v.id, v.manifest);
        await transaction(async (tx) => {
          const [current] = await tx
            .select()
            .from(contents)
            .where(eq(contents.id, v.contentId))
            .for("update");
          const [fresh] = await tx
            .select()
            .from(versions)
            .where(currentVersion(v.id, v.sha256));
          if (!["publishing", "publish_error"].includes(fresh.state)) return;
          if (current.draftVersionId !== v.id) {
            await tx
              .update(versions)
              .set({ state: "superseded" })
              .where(currentVersion(v.id, v.sha256));
            return;
          }
          await tx
            .update(contents)
            .set({ publishedVersionId: v.id, updatedAt: new Date() })
            .where(eq(contents.id, v.contentId));
          await tx
            .update(versions)
            .set({ state: "published", error: null, updatedAt: new Date() })
            .where(currentVersion(v.id, v.sha256));
          await tx.insert(audit).values({
            action: "content.published",
            targetId: v.id,
            details: { sha256: v.sha256 },
          });
        });
      } catch (e) {
        await db
          .update(versions)
          .set({
            state: "publish_error",
            error: "Yayın dosyaları hazırlanamadı. Yeniden denenecek.",
          })
          .where(currentVersion(v.id, v.sha256));
        throw e;
      }
    }
  } finally {
    await lock.query("SELECT pg_advisory_unlock(hashtext($1))", [
      data.versionId,
    ]);
    lock.release();
  }
}
import { ne } from "drizzle-orm";
const sqlNotPublished = () => ne(versions.state, "published");

const currentVersion = (id: string, sha: string, state?: string) =>
  and(
    eq(versions.id, id),
    eq(versions.sha256, sha),
    state ? eq(versions.state, state) : undefined,
    sql`EXISTS(SELECT 1 FROM contents WHERE contents.id=${versions.contentId} AND contents.draft_version_id=${versions.id})`,
  );
