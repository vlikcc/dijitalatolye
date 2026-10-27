import { rolesFor } from "@/lib/permissions";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { pageUser } from "@/server/page-access";
import { Panel } from "@/components/panel";
import { teacherContents } from "@/modules/workspace-lists";
import {
  ListSearch,
  ListSummary,
  Pagination,
} from "@/components/list-controls";
import type { WorkspaceParams } from "@/lib/workspace-list";
import { getPublicationProgress } from "@/lib/publication-progress";
import { Button } from "@/components/ui/button";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<WorkspaceParams>;
}) {
  const u = await pageUser(rolesFor("create"), true, "/ogretmen");
  const {
    rows,
    total,
    page,
    filters: f,
  } = await teacherContents(u, await searchParams);
  const filtered = !!f.query || f.status !== "all";
  return (
    <Panel role={u.role}>
      <div className="page-heading">
        <h1>İçeriklerim</h1>
        <p>Merhaba {u.name}. Oyunlarınızın yolculuğunu buradan takip edin.</p>
      </div>
      <Button asChild>
        <Link href="/ogretmen/yeni">Yeni oyun paylaş</Link>
      </Button>
      <ListSearch
        key={`${f.query}-${f.status}`}
        pathname="/ogretmen"
        query={f.query}
        placeholder="İçerik başlığı ara"
      >
        <label>
          Durum
          <select aria-label="Durum" name="durum" defaultValue={f.status}>
            <option value="all">Tümü</option>
            <option value="attention">İşlemim bekleniyor</option>
            <option value="review">İncelemede</option>
            <option value="live">Yayında</option>
          </select>
        </label>
      </ListSearch>
      <p className="form-help">
        Yayın ve yeni sürüm birlikte bulunabilir; filtreler farklı çalışma
        durumlarını gösterir.
      </p>
      <ListSummary total={total} page={page} />
      <div className="row-list" style={{ marginTop: 30 }}>
        {rows.map(({ content, version, publishedVersion, title }) => {
          const progress = getPublicationProgress({
            version,
            publishedVersionId: content.publishedVersionId,
            publishedVersion,
          });
          return (
            <article className="content-row" key={content.id}>
              <div className="row-data">
                <Link href={`/ogretmen/icerik/${content.id}`}>
                  <h3>{title}</h3>
                </Link>
                <p>
                  {version?.metadataConfirmedAt
                    ? `${version.metadata.grade}. sınıf · `
                    : ""}
                  {progress.title}
                </p>
                {progress.previousPublicationLive && (
                  <p className="form-help">
                    Önceki sürüm yayında · Bu sürüm henüz yayında değil.
                  </p>
                )}
              </div>
              <div className="content-next-action">
                <StatusBadge
                  tone={
                    progress.live
                      ? "success"
                      : progress.previousPublicationLive
                        ? "pending"
                        : "neutral"
                  }
                >
                  {progress.live
                    ? "Yayında"
                    : progress.previousPublicationLive
                      ? "Yayın + yeni sürüm"
                      : "Yayında değil"}
                </StatusBadge>
                <Link
                  className="button button-outline button-sm"
                  href={`/ogretmen/icerik/${content.id}${progress.action?.href ?? ""}`}
                >
                  {progress.action?.label ??
                    (version?.state === "revision_requested"
                      ? "Düzeltmeyi aç"
                      : "Ayrıntıları gör")}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {!rows.length && (
        <div className="empty" style={{ marginTop: 30 }}>
          <h2>
            {filtered
              ? "Bu filtreye uygun içerik yok."
              : "İlk oyununuzla başlayın."}
          </h2>
          <p>
            {filtered
              ? "Aramayı veya durum filtresini değiştirin."
              : "Hazırladığınız HTML oyununu yükleyin; tarama ve yönetici incelemesini burada takip edin."}
          </p>
          <Link
            className="button button-outline"
            href={filtered ? "/ogretmen" : "/ogretmen/yeni"}
          >
            {filtered ? "Filtreleri temizle" : "Oyun paylaş"}
          </Link>
        </div>
      )}
      <Pagination
        pathname="/ogretmen"
        query={f.query}
        params={{ durum: f.status }}
        page={page}
        total={total}
      />
    </Panel>
  );
}
