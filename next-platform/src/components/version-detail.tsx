import { StatusBadge } from "./status-badge";
import { CoverImage } from "./cover-image";
import { PublicationProgress } from "./publication-progress";
import {
  getPublicationProgress,
  type ProgressVersion,
} from "@/lib/publication-progress";
import { WorkspaceSections } from "./workspace-sections";
import { TechnicalReport } from "./technical-report";
import { versions } from "@/server/schema";
import { stateLabel } from "@/modules/content";
import { Preview, ActionForm } from "./action-form";
import { StatusRefresh } from "./status-refresh";
import { MetadataEditor } from "./metadata-editor";
import { CurriculumReview } from "./curriculum-review";
import { db } from "@/server/db";
import { taxonomy, grades } from "@/server/schema";
import { eq, and, asc } from "drizzle-orm";
import { selectedOutcomes } from "@/modules/curriculum";
export async function VersionDetail({
  version: v,
  review = false,
  owner = false,
  publishedVersionId,
  publishedVersion,
}: {
  version: typeof versions.$inferSelect;
  review?: boolean;
  owner?: boolean;
  publishedVersionId?: string | null;
  publishedVersion?: ProgressVersion | null;
}) {
  const selected = await selectedOutcomes(
    (v.state === "needs_metadata" ? v.draftMetadata : v.metadata).outcomeRefs ??
      [],
  );
  const subjects =
    owner && v.state === "needs_metadata"
      ? await db
          .select()
          .from(taxonomy)
          .where(and(eq(taxonomy.kind, "subject"), eq(taxonomy.active, true)))
          .orderBy(asc(taxonomy.label))
      : [];
  const activeGrades =
    owner && v.state === "needs_metadata"
      ? await db
          .select()
          .from(grades)
          .where(eq(grades.active, true))
          .orderBy(asc(grades.value))
      : [];
  const technical = (
    <>
      {v.scanReport && (
        <section className="report">
          <h2>Güvenlik taraması</h2>
          <p>{v.scanReport.message}</p>
          <p className="form-help">{v.scanReport.engine}</p>
        </section>
      )}
      {v.technicalReport && <TechnicalReport report={v.technicalReport} />}
      {v.extraction && v.state !== "needs_metadata" && (
        <details className="report">
          <summary>Bilgi çıkarımı ve kaynak kanıtları</summary>
          <dl>
            {Object.entries(v.extraction.fields).map(
              ([key, f]) =>
                f && (
                  <div key={key}>
                    <dt>
                      {
                        (
                          {
                            title: "Başlık",
                            description: "Açıklama",
                            grade: "Sınıf",
                            subject: "Ders",
                            programId: "Program",
                          } as Record<string, string>
                        )[key]
                      }
                    </dt>
                    <dd>
                      {f.value}
                      <br />
                      <span className="form-help">
                        {f.evidence.file} · {f.evidence.location}
                      </span>
                    </dd>
                  </div>
                ),
            )}
          </dl>
          {v.extraction.warnings.map((w, i) => (
            <p key={i} className="form-help">
              {w}
            </p>
          ))}
        </details>
      )}
      <details>
        <summary>Dosya ve sürüm bilgileri</summary>
        <p className="mono">SHA-256: {v.sha256}</p>
        <p className="form-help">
          {v.manifest.length} dosya · Giriş:{" "}
          {v.entrypoint || "Henüz belirlenmedi"}
        </p>
      </details>
    </>
  );
  const gamePreview = (
    <>
      {v.cover?.artifact && v.state !== "needs_metadata" && (
        <section className="report">
          <h2>Oyun kapağı</h2>
          <CoverImage
            src={`/api/versions/${v.id}/cover/image?asset=${v.cover.artifact.id}`}
            alt="İncelenen oyun kapağı"
          />
          <p className="form-help">
            {v.cover.artifact.source === "generated"
              ? "Otomatik kapak"
              : v.cover.artifact.source === "package"
                ? "Paket görseli"
                : "Öğretmen görseli"}
          </p>
        </section>
      )}
      {v.scanReport?.status === "clean" && v.entrypoint && (
        <section className="report">
          <h2>Oyun önizlemesi</h2>
          <Preview id={v.id} />
        </section>
      )}
    </>
  );
  return (
    <>
      {owner && (
        <PublicationProgress
          progress={getPublicationProgress({
            version: v,
            publishedVersionId,
            publishedVersion,
          })}
        />
      )}
      <div className="actions">
        {!owner && (
          <StatusBadge
            tone={
              v.state === "review"
                ? "pending"
                : v.state.endsWith("error") || v.state === "rejected"
                  ? "error"
                  : "neutral"
            }
          >
            {stateLabel[v.state] || v.state}
          </StatusBadge>
        )}
        <span className="form-help">{v.createdAt.toLocaleString("tr-TR")}</span>
      </div>
      <StatusRefresh
        active={[
          "queued",
          "scanning",
          "extracting",
          "publishing",
          "scan_error",
          "publish_error",
        ].includes(v.state)}
      />
      {v.error && (
        <p className="notice error" role="alert">
          {v.error}
        </p>
      )}
      {v.reviewNote && (
        <section className="report">
          <h2>Yöneticinin notu</h2>
          <p>{v.reviewNote}</p>
        </section>
      )}
      {v.state === "needs_entry" && owner && (
        <section className="report">
          <h2 id="entrypoint-heading">Oyun hangi dosyayla açılmalı?</h2>
          <ActionForm
            endpoint={`/api/versions/${v.id}/entrypoint`}
            label="Giriş dosyasını seç"
          >
            <label>
              HTML giriş dosyası
              <select name="entrypoint">
                {v.candidates.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </ActionForm>
        </section>
      )}
      {owner && v.state === "needs_metadata" && (
        <MetadataEditor
          key={v.id}
          versionId={v.id}
          sha256={v.sha256}
          revision={v.metadataRevision}
          draft={v.draftMetadata}
          report={v.extraction}
          subjects={subjects}
          grades={activeGrades.map((g) => g.value)}
          selected={selected.map((o) => ({
            ...o,
            reason: "Öğretmen seçimi",
            evidence: null,
          }))}
        />
      )}

      {owner ? (
        <>
          <details className="workspace-disclosure">
            <summary>Teknik rapor ve sürüm bilgileri</summary>
            {technical}
          </details>
          {gamePreview}
        </>
      ) : (
        <WorkspaceSections
          sections={[
            { title: "Oyun ve kapak", content: gamePreview },
            {
              title: "Teknik inceleme",
              note: v.technicalReport
                ? `${v.technicalReport.findings.filter((f) => f.severity === "blocker").length} engelleyici · ${v.technicalReport.findings.filter((f) => f.severity === "warning").length} uyarı`
                : undefined,
              content: technical,
            },
            ...(review && v.state === "review"
              ? [
                  {
                    title: "Değerlendirme",
                    content: (
                      <>
                        {" "}
                        {review &&
                          v.state === "review" &&
                          v.technicalReport &&
                          v.cover?.artifact && (
                            <CurriculumReview
                              technicalReport={v.technicalReport}
                              coverId={v.cover.artifact.id}
                              items={selected}
                              versionId={v.id}
                              sha256={v.sha256}
                              revision={v.metadataRevision}
                            />
                          )}
                      </>
                    ),
                  },
                ]
              : []),
          ]}
        />
      )}
    </>
  );
}
