import {
  getPublicationProgress,
  isLiveVersion,
} from "@/lib/publication-progress";
import { PublicationProgress } from "@/components/publication-progress";
import { rolesFor } from "@/lib/permissions";
import { ActionForm } from "@/components/action-form";
import Link from "next/link";
import { pageUser } from "@/server/page-access";
import { Panel } from "@/components/panel";
import { VersionDetail } from "@/components/version-detail";
import { db } from "@/server/db";
import { versions } from "@/server/schema";
import { eq, desc } from "drizzle-orm";
import { owned } from "@/modules/content";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cover?: string }>;
}) {
  const u = await pageUser(rolesFor("create"), true, "/ogretmen");
  const { id } = await params;
  const c = await owned(id, u);
  const { cover } = await searchParams;
  const list = await db
    .select()
    .from(versions)
    .where(eq(versions.contentId, id))
    .orderBy(desc(versions.createdAt));
  const v = list.find((v) => v.id === c.draftVersionId);
  const published = list.find((version) =>
    isLiveVersion(version, c.publishedVersionId),
  );
  return (
    <Panel role={u.role}>
      <div className="page-heading">
        <Link className="back-link" href="/ogretmen">
          <ArrowLeft size={16} aria-hidden="true" />
          İçeriklerime dön
        </Link>
        <h1>
          {(v?.metadataConfirmedAt
            ? v.metadata.title
            : v?.draftMetadata.title ||
              v?.extraction?.fields.title?.value ||
              v?.originalFilename) || "İçerik yüklemesi"}
        </h1>
        <p>{v?.metadata.description}</p>
      </div>
      <div className="actions">
        {c.ownerId === u.id && (
          <Button asChild variant="outline">
            <Link href={`/ogretmen/yeni?content=${id}`}>Yeni sürüm yükle</Link>
          </Button>
        )}
        {published && (
          <Link href={`/icerik/${c.slug}`}>Yayındaki oyunu gör</Link>
        )}
      </div>
      {c.ownerId === u.id &&
        published &&
        (c.draftVersionId === c.publishedVersionId ||
          ["rejected", "revision_requested", "superseded"].includes(
            v?.state ?? "",
          )) && (
          <ActionForm
            endpoint={`/api/contents/${id}/revisions`}
            label="Kapağı veya bilgileri düzenle"
            data={{ sourceVersionId: c.publishedVersionId }}
            variant="outline"
          >
            <p className="form-help">
              Aynı oyun paketinden yeni bir inceleme sürümü oluşturulur. Onaya
              kadar mevcut yayın korunur.
            </p>
          </ActionForm>
        )}
      {cover === "failed" && (
        <p className="notice warning" role="status">
          <strong>Oyun dosyanız yüklendi; kapak eklenemedi.</strong> Oyun
          bilgileri hazır olduğunda kapağı içerik ekranından ekleyebilirsiniz.
        </p>
      )}
      <hr className="divider" />
      {v ? (
        <VersionDetail
          version={v}
          owner={c.ownerId === u.id}
          publishedVersionId={c.publishedVersionId}
          publishedVersion={published}
        />
      ) : (
        <PublicationProgress
          progress={getPublicationProgress({
            publishedVersionId: c.publishedVersionId,
            publishedVersion: published,
          })}
        />
      )}
      {list.length > 1 && (
        <section className="report">
          <h2>Sürüm geçmişi</h2>
          <ol className="version-timeline">
            {list
              .filter((x) => x.id !== v?.id)
              .map((x) => (
                <li key={x.id}>
                  <time dateTime={x.createdAt.toISOString()}>
                    {x.createdAt.toLocaleString("tr-TR")}
                  </time>
                  <p>{x.metadata.title || x.originalFilename}</p>
                  <StatusBadge
                    tone={
                      isLiveVersion(x, c.publishedVersionId)
                        ? "success"
                        : x.revokedAt
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {isLiveVersion(x, c.publishedVersionId)
                      ? "Yayında"
                      : x.revokedAt
                        ? "Yayını iptal edildi"
                        : "Eski sürüm"}
                  </StatusBadge>
                </li>
              ))}
          </ol>
        </section>
      )}
    </Panel>
  );
}
