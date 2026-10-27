import { StatusBadge } from "@/components/status-badge";
import { TeacherStart } from "@/components/learning-start";
import { CopyClassCode } from "@/components/copy-class-code";
import { rolesFor } from "@/lib/permissions";
import { notFound } from "next/navigation";
import { learningEnabled } from "@/server/learning-feature";
import { pageUser } from "@/server/page-access";
import { teacherDashboard } from "@/modules/learning";
import { Panel } from "@/components/panel";
import {
  LearningAction,
  SimpleLearningForm,
} from "@/components/learning-forms";
export default async function Classes() {
  if (!learningEnabled()) notFound();
  const u = await pageUser(rolesFor("create"), true, "/ogretmen");
  const d = await teacherDashboard(u);
  return (
    <Panel role={u.role}>
      <header className="page-heading">
        <h1>Sınıflarım</h1>
        <p>Sınıf kodunu paylaşın, öğrencilerin katılımını onaylayın.</p>
      </header>
      <TeacherStart
        classes={d.classes}
        members={d.members}
        assignments={d.assignments}
      />
      <div id="class-create">
        <SimpleLearningForm
          successMessage="Sınıf oluşturuldu. Katılım kodunu öğrencilerinle paylaşabilirsin."
          endpoint="/api/learning/classes"
          field="name"
          label="Sınıf adı"
          button="Sınıf oluştur"
        />
      </div>
      {!d.classes.length && (
        <p className="notice">
          İlk sınıfınızı oluşturduğunuzda öğrencilerinizin kullanacağı katılım
          kodu burada görünecek.
        </p>
      )}
      {d.classes.map((c) => (
        <section className="learning-section" key={c.id} id={`class-${c.id}`}>
          <div className="learning-section-heading">
            <div>
              <h2>{c.name}</h2>
              <div className="class-summary">
                <StatusBadge tone="success">
                  {
                    d.members.filter(
                      (m) => m.class_id === c.id && m.status === "active",
                    ).length
                  }{" "}
                  onaylı
                </StatusBadge>
                <StatusBadge tone="pending">
                  {
                    d.members.filter(
                      (m) => m.class_id === c.id && m.status === "pending",
                    ).length
                  }{" "}
                  bekleyen
                </StatusBadge>
              </div>
              <div className="class-code-group">
                {c.archived ? (
                  "Arşivlendi"
                ) : (
                  <>
                    Katılım kodu:{" "}
                    <strong className="learning-code">{c.join_code}</strong>
                    <CopyClassCode code={c.join_code} />
                  </>
                )}
              </div>
            </div>
            {!c.archived && (
              <div className="learning-actions">
                <LearningAction
                  endpoint={`/api/learning/classes/${c.id}`}
                  body={{ action: "rotate" }}
                  label="Kodu yenile"
                  confirmation="Eski katılım kodu artık çalışmayacak. Yenilensin mi?"
                />
                <LearningAction
                  endpoint={`/api/learning/classes/${c.id}`}
                  body={{ action: "archive" }}
                  label="Arşivle"
                  confirmation="Sınıfa katılım ve ödevlerde yeni çalışma kapanacak. Arşivlensin mi?"
                />
              </div>
            )}
          </div>
          {!d.members.some((m) => m.class_id === c.id) ? (
            <p>Henüz katılım isteği yok.</p>
          ) : (
            <ul className="learning-list">
              {d.members
                .filter((m) => m.class_id === c.id)
                .map((m) => (
                  <li key={m.student_id}>
                    <div>
                      <h3>{m.name}</h3>
                      <p>
                        {m.username}{" "}
                        <StatusBadge
                          tone={
                            m.status === "active"
                              ? "success"
                              : m.status === "pending"
                                ? "pending"
                                : "neutral"
                          }
                        >
                          {m.status === "active"
                            ? "Onaylı"
                            : m.status === "pending"
                              ? "Onay bekliyor"
                              : "Üyelik kaldırıldı"}
                        </StatusBadge>
                      </p>
                    </div>
                    {!c.archived && (
                      <div className="learning-actions">
                        {m.status !== "active" ? (
                          <LearningAction
                            endpoint={`/api/learning/classes/${c.id}`}
                            body={{
                              action: "approve",
                              studentId: m.student_id,
                            }}
                            label="Onayla"
                          />
                        ) : (
                          <LearningAction
                            endpoint={`/api/learning/classes/${c.id}`}
                            body={{ action: "remove", studentId: m.student_id }}
                            label="Üyeliği kaldır"
                            confirmation="Öğrencinin bu sınıftaki ödevlere erişimi kapanacak. Devam edilsin mi?"
                          />
                        )}
                        {m.status === "pending" && (
                          <LearningAction
                            endpoint={`/api/learning/classes/${c.id}`}
                            body={{ action: "reject", studentId: m.student_id }}
                            label="Reddet"
                          />
                        )}
                        {m.recovery_teacher_id === u.id && (
                          <LearningAction
                            endpoint={`/api/learning/recovery/${m.student_id}`}
                            body={{}}
                            label="Parola yenileme kodu"
                          />
                        )}
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </section>
      ))}
    </Panel>
  );
}
