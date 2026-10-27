import { StatusBadge, ProgressValue } from "@/components/status-badge";
import { StudentStart } from "@/components/learning-start";
import Link from "next/link";
import { notFound } from "next/navigation";
import { learningEnabled } from "@/server/learning-feature";
import { pageUser } from "@/server/page-access";
import { studentDashboard } from "@/modules/learning";
import { Panel } from "@/components/panel";
import { SimpleLearningForm } from "@/components/learning-forms";
import { learningDate, assignmentStatus } from "@/lib/learning-display";
export default async function StudentPage({
  searchParams,
}: {
  searchParams: Promise<{ bolum?: string }>;
}) {
  const requested = (await searchParams).bolum;
  const section = ["oyunlar", "siniflar"].includes(requested ?? "")
    ? requested
    : "odevler";
  if (!learningEnabled()) notFound();
  const u = await pageUser(["student"]);
  const data = await studentDashboard(u);
  return (
    <Panel role="student">
      <header className="page-heading">
        <h1>
          {section === "oyunlar"
            ? "Oyunlarım"
            : section === "siniflar"
              ? "Sınıflarım"
              : "Ödevlerim"}
        </h1>
        <p>
          {section === "odevler"
            ? `Merhaba, ${u.name}. Sınıfındaki oyunlar burada.`
            : section === "oyunlar"
              ? "Kayıt destekli oyunlarına kaldığın yerden devam et."
              : "Sınıflarını gör, yeni bir sınıfa katıl."}
        </p>
      </header>
      {section === "odevler" && (
        <section className="learning-section" id="odevler">
          {!data.assignments.length ? (
            <StudentStart classes={data.classes} />
          ) : (
            <ul className="learning-list">
              {data.assignments.map((a) => (
                <li
                  key={a.id}
                  data-resumable={
                    a.started &&
                    !a.completed &&
                    !a.closed &&
                    !a.archived &&
                    a.membership === "active"
                  }
                >
                  <div>
                    <h3>{a.title}</h3>
                    <p>
                      {a.game_title} · {a.class_name} · {a.teacher_name}
                    </p>
                    <p>
                      <StatusBadge
                        tone={
                          a.closed || a.archived || a.membership !== "active"
                            ? "neutral"
                            : a.completed
                              ? "success"
                              : a.started
                                ? "pending"
                                : "neutral"
                        }
                      >
                        {assignmentStatus(a)}
                      </StatusBadge>
                    </p>
                    {a.due_at && (
                      <p className="task-date">
                        Son tarih: {learningDate(a.due_at)}
                      </p>
                    )}
                    {a.tracking && a.started && (
                      <p className="form-help">
                        Oyunun bildirdiği son sonuç: ilerleme{" "}
                        {a.progress === null ? "henüz yok" : `%${a.progress}`} ·
                        puan {a.score ?? "henüz yok"}
                      </p>
                    )}
                    {a.instructions && (
                      <p className="learning-instructions">{a.instructions}</p>
                    )}
                    {!a.tracking && (
                      <p className="form-help">
                        Bu oyunda yalnızca açılma bilgisi izlenir.
                      </p>
                    )}
                  </div>
                  {!a.closed && !a.archived && a.membership === "active" && (
                    <Link
                      className="button button-primary"
                      href={`/ogrenci/oyna/${a.content_id}?odev=${a.id}`}
                    >
                      {a.completed
                        ? "Sonucu gör"
                        : a.started
                          ? "Devam et"
                          : "Ödeve başla"}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {section === "oyunlar" && (
        <section className="learning-section" id="oyunlar">
          <p>Buradaki serbest oyun kayıtların öğretmen raporlarına eklenmez.</p>
          {!data.games.length ? (
            <p className="notice">
              <Link href="/kesfet">Bir oyun keşfet</Link>; kayıt desteği olan
              oyunlara buradan devam edebilirsin.
            </p>
          ) : (
            <ul className="learning-list">
              {data.games.map((g) => (
                <li key={g.id}>
                  <div>
                    <h3>{g.title}</h3>
                    <p>
                      {!g.tracking
                        ? "Açıldı · Kayıt desteği yok"
                        : g.completed_at
                          ? "Tamamlandı"
                          : g.progress === null
                            ? "Devam ediyor"
                            : `İlerleme: %${g.progress}`}
                    </p>
                    {g.tracking && g.progress !== null && (
                      <ProgressValue value={g.progress} />
                    )}
                  </div>
                  <Link
                    className="button button-outline"
                    href={`/ogrenci/oyna/${g.content_id}`}
                  >
                    {g.completed_at ? "Sonucu gör" : "Devam et"}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {section === "siniflar" && (
        <section className="learning-section" id="siniflar">
          <SimpleLearningForm
            successMessage="Katılma isteğin gönderildi. Öğretmeninin onayını burada görebilirsin."
            endpoint="/api/learning/join"
            field="classCode"
            label="Yeni sınıf kodu"
            button="Katılma isteği gönder"
          />
          <ul className="learning-list">
            {data.classes.map((c) => (
              <li key={c.id}>
                <div>
                  <h3>{c.name}</h3>
                  <p>
                    {c.teacher_name}{" "}
                    <StatusBadge
                      tone={
                        c.archived
                          ? "neutral"
                          : c.status === "active"
                            ? "success"
                            : c.status === "pending"
                              ? "pending"
                              : "neutral"
                      }
                    >
                      {c.archived
                        ? "Arşivlendi"
                        : c.status === "active"
                          ? "Onaylandı"
                          : c.status === "pending"
                            ? "Öğretmen onayı bekleniyor"
                            : "Üyelik kaldırıldı"}
                    </StatusBadge>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Panel>
  );
}
