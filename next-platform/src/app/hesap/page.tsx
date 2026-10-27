import { StatusBadge } from "@/components/status-badge";
import { pageUser } from "@/server/page-access";
import { SecurityForm, SignOut } from "@/components/auth-form";
import { Panel } from "@/components/panel";
import { roles, roleLabel } from "@/lib/permissions";
import { studentDashboard } from "@/modules/learning";
export default async function Account() {
  const u = await pageUser([...roles], false);
  const student = u.role === "student" ? await studentDashboard(u) : null;
  return (
    <Panel role={u.role}>
      <div className="page-heading">
        <h1>Hesabım</h1>
        <p>
          {u.name} · <StatusBadge>{roleLabel(u.role)}</StatusBadge>
        </p>
      </div>
      <section className="account-section">
        <h2>Hesap bilgileri</h2>
        <p>
          {student ? (
            <>
              Kullanıcı adın: <strong>{student.profile.username}</strong>
            </>
          ) : (
            u.email
          )}
        </p>
      </section>
      <section className="account-section">
        <h2>{student ? "Hesap kurtarma" : "Hesap güvenliği"}</h2>
        {student ? (
          <p>
            Parolanı unutursan{" "}
            {student.profile.recovery_teacher ||
              "sınıfını ilk onaylayan öğretmen"}{" "}
            yardımcı olabilir.
          </p>
        ) : u.twoFactorEnabled ? (
          <p>
            <StatusBadge tone="success">
              İki aşamalı doğrulama etkin.
            </StatusBadge>
          </p>
        ) : (
          <>
            <p className="form-help">
              Yönetici ve admin erişimi için iki aşamalı doğrulama gerekir.
            </p>
            <SecurityForm />
          </>
        )}
      </section>
      <SignOut />
    </Panel>
  );
}
