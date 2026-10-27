import { rolesFor } from "@/lib/permissions";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { pageUser } from "@/server/page-access";
import { Panel } from "@/components/panel";
import { reviewQueue } from "@/modules/workspace-lists";
import {
  ListSearch,
  ListSummary,
  Pagination,
} from "@/components/list-controls";
import type { WorkspaceParams } from "@/lib/workspace-list";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<WorkspaceParams>;
}) {
  const u = await pageUser(rolesFor("review"));
  const {
    rows,
    total,
    page,
    filters: f,
    subjects,
    grades,
  } = await reviewQueue(u, await searchParams);
  const filtered = !!(f.query || f.grade || f.subject);
  return (
    <Panel role={u.role}>
      <div className="page-heading">
        <h1>İnceleme kuyruğu</h1>
        <p>Güvenlik taramasından geçmiş, öğretmenlerin paylaştığı oyunlar.</p>
      </div>
      <ListSearch
        key={`${f.query}-${f.grade}-${f.subject}-${f.sort}`}
        pathname="/editor"
        query={f.query}
        placeholder="İncelenecek başlık ara"
      >
        <label>
          Sınıf
          <select aria-label="Sınıf" name="sinif" defaultValue={f.grade}>
            <option value="">Tüm sınıflar</option>
            {grades.map((g) => (
              <option key={g.value} value={g.value}>
                {g.value}. sınıf
              </option>
            ))}
          </select>
        </label>
        <label>
          Ders
          <select aria-label="Ders" name="ders" defaultValue={f.subject}>
            <option value="">Tüm dersler</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sürüm oluşturma tarihi
          <select
            aria-label="Sürüm oluşturma tarihi"
            name="siralama"
            defaultValue={f.sort}
          >
            <option value="oldest">Eskiden yeniye</option>
            <option value="newest">Yeniden eskiye</option>
          </select>
        </label>
      </ListSearch>
      <ListSummary total={total} page={page} />
      <div className="row-list">
        {rows.map(({ v, subject }) => (
          <article className="content-row" key={v.id}>
            <div className="row-data">
              <Link href={`/editor/${v.id}`}>
                <h3>{v.metadata.title}</h3>
              </Link>
              <p>
                {v.metadata.grade}. sınıf · {subject && `${subject} · `}Sürüm
                oluşturma: {v.createdAt.toLocaleDateString("tr-TR")}
              </p>
            </div>
            <div className="content-next-action">
              <StatusBadge tone="pending">İncelemeye hazır</StatusBadge>
              <Link
                className="button button-outline button-sm"
                href={`/editor/${v.id}`}
              >
                İncele
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!rows.length && (
        <div className="empty">
          <h2>
            {filtered
              ? "Bu filtreye uygun inceleme yok."
              : "Kuyruk tamamlandı."}
          </h2>
          <p>
            {filtered
              ? "Aramayı veya filtreleri değiştirin."
              : "Yeni bir oyun taramadan geçtiğinde burada görünecek."}
          </p>
        </div>
      )}
      <Pagination
        pathname="/editor"
        query={f.query}
        params={{ sinif: f.grade, ders: f.subject, siralama: f.sort }}
        page={page}
        total={total}
      />
    </Panel>
  );
}
