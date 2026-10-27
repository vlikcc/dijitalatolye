import { StatusBadge } from "@/components/status-badge";
import { rolesFor } from "@/lib/permissions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { learningEnabled } from "@/server/learning-feature";
import { pageUser } from "@/server/page-access";
import { assignmentReuseSeed, teacherDashboard } from "@/modules/learning";
import { AppError } from "@/server/errors";
import { Panel } from "@/components/panel";
import { AssignmentForm } from "@/components/learning-forms";
import { learningDate } from "@/lib/learning-display";
export default async function Assignments({
  searchParams,
}: {
  searchParams: Promise<{
    oyun?: string | string[];
    yeniden?: string | string[];
  }>;
}) {
  if (!learningEnabled()) notFound();
  const u = await pageUser(rolesFor("create"), true, "/ogretmen");
  const d = await teacherDashboard(u);
  const q = await searchParams;
  const seed =
    q.yeniden !== undefined
      ? await assignmentReuseSeed(
          u,
          typeof q.yeniden === "string" ? q.yeniden : "",
        ).catch((e) => {
          if (e instanceof AppError && e.status === 404) notFound();
          throw e;
        })
      : undefined;
  const selectedGame =
    seed?.contentId ?? (typeof q.oyun === "string" ? q.oyun : undefined);
  return (
    <Panel role={u.role}>
      <header className="page-heading">
        <h1>Ödevlerim</h1>
        <p>Bir oyun seçin, sınıfınıza veya belirli öğrencilere verin.</p>
      </header>
      <details
        key={seed?.sourceId ?? selectedGame ?? "new"}
        className="learning-create"
        open={!!seed || !!selectedGame || !d.assignments.length}
      >
        <summary>{seed ? "Ödevi yeniden kullan" : "Yeni ödev ver"}</summary>
        <AssignmentForm
          seed={seed}
          classes={d.classes}
          members={d.members}
          games={d.games}
          selectedGame={selectedGame}
        />
      </details>
      <section className="learning-section">
        <h2>Verdiğim ödevler</h2>
        {!d.assignments.length ? (
          <p>İlk ödevinizin sonuçları burada görünecek.</p>
        ) : (
          <ul className="learning-list">
            {d.assignments.map((a) => (
              <li key={a.id}>
                <div>
                  <h3>{a.title}</h3>
                  <p>
                    {a.class_name} · {a.game_title}
                  </p>
                  <p>
                    <StatusBadge tone={a.closed ? "neutral" : "success"}>
                      {a.closed ? "Kapalı" : "Açık"}
                    </StatusBadge>
                  </p>
                  {a.due_at && (
                    <p className="task-date">
                      Son tarih: {learningDate(a.due_at)}
                    </p>
                  )}
                </div>
                <div className="assignment-actions">
                  <Link
                    className="button button-ghost"
                    href={`/ogretmen/odevler?yeniden=${a.id}`}
                  >
                    Yeniden kullan
                  </Link>
                  <Link
                    className="button button-outline"
                    href={`/ogretmen/odevler/${a.id}`}
                  >
                    Sonuçları gör
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Panel>
  );
}
