import { StatusBadge } from "@/components/status-badge";
import { CopyButton } from "@/components/copy-button";
import Link from "next/link";
import { learningEnabled } from "@/server/learning-feature";
import { LearningAction } from "@/components/learning-forms";
import { pageUser } from "@/server/page-access";
import { Panel } from "@/components/panel";
import { ActionForm } from "@/components/action-form";
import { PageHeading, EmptyState } from "@/components/page-heading";
import {
  ListSearch,
  ListSummary,
  Pagination,
} from "@/components/list-controls";
import { db, pool } from "@/server/db";
import {
  user,
  taxonomy,
  versions,
  contents,
  audit,
  grades,
} from "@/server/schema";
import {
  desc,
  eq,
  inArray,
  or,
  sql,
  and,
  ilike,
  count,
  asc,
} from "drizzle-orm";
import { roleLabel, rolesFor, roles } from "@/lib/permissions";
const auditLabels: Record<string, string> = {
  "user.role_changed": "Kullanıcı rolü güncellendi",
  "cover.retried": "Kapak yeniden kuyruğa alındı",
  "job.retried": "İş yeniden kuyruğa alındı",
  "cover.selected": "Kapak seçildi",
  "version.uploaded": "Sürüm yüklendi",
  "metadata.submitted": "Bilgiler incelemeye gönderildi",
  "metadata.saved": "Bilgiler kaydedildi",
  "content.unpublished": "Yayın kaldırıldı",
  "grade.updated": "Sınıf tanımı güncellendi",
  "curriculum.source_verified": "Kazanım kaynağı doğrulandı",
  "class.member_active": "Sınıf üyeliği onaylandı",
  "class.member_removed": "Sınıf üyeliği kaldırıldı",
  "review.approve": "Yayın onaylandı",
  "review.reject": "Yayın reddedildi",
  "review.revision": "Düzeltme istendi",
};
const sections = {
  kullanicilar: [
    "Kullanıcılar",
    "Hesapları, rol yetkilerini ve öğrenci kurtarma işlemlerini yönet.",
  ],
  tanimlar: [
    "Tanımlar",
    "Katalogda kullanılan sınıf, ders ve kazanımları düzenle.",
  ],
  yayinlar: [
    "Yayınlar",
    "Yayındaki oyunları incele; gerektiğinde erişimi kaldır.",
  ],
  sistem: [
    "Sistem işlemleri",
    "İşlem hatalarını kontrol et ve başarısız işleri yeniden dene.",
  ],
  kayitlar: [
    "İşlem kayıtları",
    "Sistemdeki değişiklikleri ve işlem geçmişini izle.",
  ],
} as const;
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ bolum?: string; q?: string; sayfa?: string }>;
}) {
  const u = await pageUser(rolesFor("administer"));
  const params = await searchParams;
  const section =
    typeof params.bolum === "string" && Object.hasOwn(sections, params.bolum)
      ? (params.bolum as keyof typeof sections)
      : "kullanicilar";
  const query = (typeof params.q === "string" ? params.q : "")
    .trim()
    .slice(0, 120);
  const search = "%" + query.replace(/[\\%_]/g, "\\$&") + "%";
  let page = Math.max(
    1,
    Math.min(10000, Number.parseInt(params.sayfa ?? "1", 10) || 1),
  );
  let total = 0;
  let recordCount: number | undefined;
  const paginate = (n: number) => {
    total = n;
    page = Math.min(page, Math.max(1, Math.ceil(n / 25)));
    return (page - 1) * 25;
  };
  let body: React.ReactNode;
  if (section === "kullanicilar") {
    const where = query
      ? or(
          ilike(user.name, search),
          ilike(user.email, search),
          ilike(user.role, search),
          inArray(
            user.role,
            roles.filter((role) =>
              roleLabel(role)
                .toLocaleLowerCase("tr-TR")
                .includes(query.toLocaleLowerCase("tr-TR")),
            ),
          ),
        )
      : undefined;
    const offset = paginate(
      (await db.select({ n: count() }).from(user).where(where))[0].n,
    );
    const rows = await db
      .select()
      .from(user)
      .where(where)
      .orderBy(asc(user.name), asc(user.id))
      .limit(25)
      .offset(offset);
    body = rows.map((x) => (
      <div className="content-row" key={x.id}>
        <div className="row-data">
          <strong>{x.name}</strong>
          <p>
            <StatusBadge>{roleLabel(x.role)}</StatusBadge>
            {x.role !== "student" && (
              <>
                {" "}
                · {x.email}
                <br />
                <StatusBadge tone={x.twoFactorEnabled ? "success" : "neutral"}>
                  {x.twoFactorEnabled
                    ? "İki aşamalı doğrulama etkin"
                    : "İki aşamalı doğrulama kurulmadı"}
                </StatusBadge>
              </>
            )}
          </p>
        </div>
        {x.role === "student" ? (
          learningEnabled() && (
            <LearningAction
              endpoint={`/api/learning/recovery/${x.id}`}
              body={{ takeover: true }}
              label="Hesap kurtarmayı devral"
              confirmation="Bu öğrencinin hesap kurtarma sorumluluğu size geçecek. Devam edilsin mi?"
            />
          )
        ) : x.id !== u.id ? (
          <ActionForm
            endpoint={`/api/admin/users/${x.id}/role`}
            label="Rolü güncelle"
            successMessage="Rol güncellendi."
          >
            <label>
              Rol
              <select name="role" defaultValue={x.role}>
                <option value="teacher">Öğretmen</option>
                <option value="editor">Yönetici</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </ActionForm>
        ) : (
          <span className="badge">Siz · Admin</span>
        )}
      </div>
    ));
  } else if (section === "tanimlar") {
    const where = query ? ilike(taxonomy.label, search) : undefined;
    const offset = paginate(
      (await db.select({ n: count() }).from(taxonomy).where(where))[0].n,
    );
    const [terms, subjects, definitions] = await Promise.all([
      db
        .select()
        .from(taxonomy)
        .where(where)
        .orderBy(asc(taxonomy.kind), asc(taxonomy.label), asc(taxonomy.id))
        .limit(25)
        .offset(offset),
      db
        .select()
        .from(taxonomy)
        .where(eq(taxonomy.kind, "subject"))
        .orderBy(asc(taxonomy.label)),
      db.select().from(grades).orderBy(grades.value),
    ]);
    body = (
      <>
        <details className="workspace-disclosure">
          <summary>Sınıf tanımları</summary>
          <p className="form-help">Pasifleştirme mevcut yayınları kaldırmaz.</p>
          {definitions.map((g) => (
            <div className="content-row" key={g.value}>
              <div>
                <strong>{g.value}. sınıf</strong>
                <p>
                  <StatusBadge tone={g.active ? "success" : "neutral"}>
                    {g.active ? "Etkin" : "Pasif"}
                  </StatusBadge>
                </p>
              </div>
              <ActionForm
                endpoint={`/api/admin/grades/${g.value}`}
                label={g.active ? "Pasifleştir" : "Etkinleştir"}
                data={{ active: !g.active }}
                variant="outline"
              />
            </div>
          ))}
        </details>
        <details className="workspace-disclosure">
          <summary>Ders veya kazanım ekle</summary>
          <ActionForm endpoint="/api/admin/taxonomy" label="Tanım ekle">
            <div className="form-row">
              <label>
                Tür
                <select name="kind">
                  <option value="subject">Ders</option>
                  <option value="outcome">Kazanım</option>
                </select>
              </label>
              <label>
                Kazanımın dersi
                <select name="parentId">
                  <option value="">Ders için boş bırakın</option>
                  {subjects.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Ad / açıklama
              <input name="label" required minLength={2} maxLength={500} />
            </label>
          </ActionForm>
        </details>
        {terms.map((t) => (
          <div className="content-row" key={t.id}>
            <div className="row-data">
              <strong>{t.label}</strong>
              <p>
                {t.kind === "subject" ? "Ders" : "Kazanım"} ·{" "}
                <StatusBadge tone={t.active ? "success" : "neutral"}>
                  {t.active ? "Etkin" : "Pasif"}
                </StatusBadge>
              </p>
            </div>
            <ActionForm
              endpoint="/api/admin/taxonomy"
              label={t.active ? "Pasifleştir" : "Etkinleştir"}
              data={{ id: t.id, active: !t.active }}
              variant="outline"
            />
          </div>
        ))}
      </>
    );
  } else if (section === "yayinlar") {
    const where = query
      ? sql`${versions.metadata}->>'title' ILIKE ${search}`
      : undefined;
    const offset = paginate(
      (
        await db
          .select({ n: count() })
          .from(contents)
          .innerJoin(versions, eq(contents.publishedVersionId, versions.id))
          .where(where)
      )[0].n,
    );
    const rows = await db
      .select({ c: contents, v: versions })
      .from(contents)
      .innerJoin(versions, eq(contents.publishedVersionId, versions.id))
      .where(where)
      .orderBy(desc(versions.createdAt), asc(versions.id))
      .limit(25)
      .offset(offset);
    body = rows.map(({ c, v }) => (
      <div className="content-row" key={c.id}>
        <div className="row-data">
          <strong>{v.metadata.title}</strong>
          <p>
            <Link href={`/editor/${v.id}`}>Teknik inceleme</Link>
          </p>
        </div>
        <ActionForm
          endpoint={`/api/contents/${c.id}/unpublish`}
          label="Yayından kaldır"
          successMessage="Oyun yayından kaldırıldı."
          variant="destructive"
        />
      </div>
    ));
  } else if (section === "sistem") {
    const where = and(
      or(
        sql`${versions.cover}->>'status' = 'error'`,
        inArray(versions.state, ["scan_error", "publish_error", "extracting"]),
      ),
      query ? sql`${versions.metadata}->>'title' ILIKE ${search}` : undefined,
    );
    const failures = (
      await db.select({ n: count() }).from(versions).where(where)
    )[0].n;
    const jobsTotal = Number(
      (
        await pool.query(
          "SELECT count(*) FROM pgboss.job WHERE state='failed' AND name ILIKE $1",
          [search],
        )
      ).rows[0].count,
    );
    const offset = paginate(Math.max(failures, jobsTotal));
    recordCount = failures + jobsTotal;
    const failed = await db
      .select()
      .from(versions)
      .where(where)
      .orderBy(desc(versions.createdAt), asc(versions.id))
      .limit(25)
      .offset(offset);
    const jobs = await pool.query(
      "SELECT id,name,state,retry_count,created_on,data->>'versionId' AS version_id FROM pgboss.job WHERE state='failed' AND name ILIKE $1 ORDER BY created_on DESC,id LIMIT 25 OFFSET $2",
      [search, offset],
    );
    body = (
      <>
        <h2 className="list-section-title">
          İşlem hataları <span>({failures})</span>
        </h2>
        <ListSummary total={failures} page={page} label="işlem hatası" />
        {failed.map((v) => (
          <div className="content-row" key={v.id}>
            <div className="row-data">
              <Link href={`/editor/${v.id}`}>
                <strong>{v.metadata.title}</strong>
              </Link>
              <p>
                {v.cover?.error || v.error || "Oyun bilgileri çıkarılıyor."}
              </p>
            </div>
            <ActionForm
              endpoint={`/api/admin/retry/${v.id}`}
              label="Yeniden dene"
              successMessage="İş tekrar kuyruğa alındı."
              variant="outline"
            />
          </div>
        ))}
        {!failures && <p className="notice">İşlem hatası bulunmuyor.</p>}
        <details className="workspace-disclosure">
          <summary>Başarısız kuyruk işleri ({jobsTotal})</summary>
          <ListSummary total={jobsTotal} page={page} label="başarısız iş" />
          {jobs.rows.map((j) => (
            <p className="mono" key={j.id}>
              {j.name} · {j.version_id} · deneme {j.retry_count}
            </p>
          ))}
          {!jobsTotal && <p>Başarısız kuyruk işi yok.</p>}
        </details>
      </>
    );
  } else {
    const where = query
      ? or(
          ilike(audit.action, search),
          sql`${audit.targetId}::text ILIKE ${search}`,
        )
      : undefined;
    const offset = paginate(
      (await db.select({ n: count() }).from(audit).where(where))[0].n,
    );
    const rows = await db
      .select()
      .from(audit)
      .where(where)
      .orderBy(desc(audit.createdAt), desc(audit.id))
      .limit(25)
      .offset(offset);
    body = (
      <div
        className="table-wrap"
        tabIndex={0}
        role="region"
        aria-label="İşlem kayıtları tablosu"
      >
        <table className="audit-table">
          <thead>
            <tr>
              <th>Zaman</th>
              <th>İşlem</th>
              <th>Hedef</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td>{e.createdAt.toLocaleString("tr-TR")}</td>
                <td>
                  <strong>{auditLabels[e.action] ?? e.action}</strong>
                  {auditLabels[e.action] && (
                    <span className="form-help audit-action-code">
                      {e.action}
                    </span>
                  )}
                </td>
                <td>
                  {e.targetId ? (
                    <details className="audit-target">
                      <summary>Hedef: {e.targetId.slice(0, 8)}…</summary>
                      <code>{e.targetId}</code>
                      <CopyButton value={e.targetId} label="Hedefi kopyala" />
                    </details>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <Panel role={u.role}>
      <PageHeading
        title={sections[section][0]}
        description={sections[section][1]}
      />
      <ListSearch
        section={section}
        query={query}
        placeholder={
          section === "kullanicilar"
            ? "Ad, e-posta veya rol ara"
            : "Bu bölümde ara"
        }
      />
      {section !== "sistem" && <ListSummary total={total} page={page} />}
      {body}
      {total === 0 && section !== "sistem" && (
        <EmptyState title={query ? "Eşleşen kayıt yok." : "Henüz kayıt yok."}>
          {query
            ? "Başka bir sözcük deneyin veya aramayı temizleyin."
            : "Bu bölümdeki kayıtlar burada görünecek."}
        </EmptyState>
      )}
      <Pagination
        section={section}
        query={query}
        page={page}
        total={total}
        recordCount={recordCount}
      />
    </Panel>
  );
}
