import { rolesFor } from "@/lib/permissions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { learningEnabled } from "@/server/learning-feature";
import { pageUser } from "@/server/page-access";
import { assignmentReport, teacherDashboard } from "@/modules/learning";
import { AppError } from "@/server/errors";
import { Panel } from "@/components/panel";
import { LearningAction, AddRecipients } from "@/components/learning-forms";
import { AssignmentReport } from "@/components/assignment-report";
import { learningDate } from "@/lib/learning-display";
export default async function Report({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!learningEnabled()) notFound();
  const u = await pageUser(rolesFor("create"), true, "/ogretmen");
  const { id } = await params;
  const d = await assignmentReport(u, id).catch((e) => {
    if (e instanceof AppError && e.status === 404) notFound();
    throw e;
  });
  const t = await teacherDashboard(u);
  const a = d.assignment;
  return (
    <Panel role={u.role}>
      <header className="page-heading">
        <div className="assignment-actions">
          <Link href="/ogretmen/odevler">Ödevlere dön</Link>
          <Link
            className="button button-outline"
            href={`/ogretmen/odevler?yeniden=${id}`}
          >
            Yeniden kullan
          </Link>
        </div>
        <h1>{a.title}</h1>
        <p>
          {a.class_name} · {a.game_title}
        </p>
        <p>
          {a.closed ? "Kapalı" : "Açık"}
          {a.due_at && ` · Son tarih: ${learningDate(a.due_at)} (İstanbul)`}
        </p>
        {a.instructions && (
          <p className="learning-instructions">{a.instructions}</p>
        )}
      </header>
      <p className="notice">
        {a.tracking
          ? "Puan ve ilerleme oyunun bildirdiği sonuçlardır. Son puan en yeni denemeyi, en iyi puan tüm denemeleri gösterir."
          : "Bu oyunda yalnızca açılma bilgisi izlenir. Tamamlanma, puan ve ilerleme ölçülemez."}
      </p>
      <AssignmentReport assignment={a} rows={d.rows} />
      {!a.closed && (
        <section className="learning-section">
          <AddRecipients
            id={id}
            members={t.members.filter(
              (m) =>
                m.class_id === a.class_id &&
                m.status === "active" &&
                !d.rows.some((r) => r.id === m.student_id),
            )}
          />
          <LearningAction
            endpoint={`/api/learning/assignments/${id}`}
            body={{ action: "close" }}
            label="Ödevi kapat"
            confirmation="Öğrenciler bu ödevde yeni ilerleme kaydedemeyecek. Sonuçlar korunacak. Kapatılsın mı?"
          />
        </section>
      )}
    </Panel>
  );
}
