import Link from "next/link";
import {
  studentStartState,
  teacherStartStep,
  type LearningClass,
  type MemberOption,
} from "@/lib/learning-workspace";
export function StudentStart({ classes }: { classes: LearningClass[] }) {
  const state = studentStartState(classes);
  const copy = {
    waiting_assignment: [
      "Öğretmeninden ilk ödevini bekliyorsun.",
      "Sınıf üyeliğin onaylandı. Öğretmenin oyun verdiğinde burada görünecek.",
    ],
    pending: [
      "Öğretmen onayı bekleniyor.",
      "Katılma isteğin gönderildi. Öğretmenin onayladığında bu sınıfın ödevlerine erişebilirsin.",
    ],
    inactive: [
      "Etkin bir sınıf üyeliğin yok.",
      "Önceki sınıfın arşivlenmiş veya üyeliğin kaldırılmış. Öğretmeninden yeni bir sınıf kodu alabilirsin.",
    ],
    join: [
      "İlk sınıfına katıl.",
      "Öğretmeninden aldığın sınıf koduyla katılma isteği gönder.",
    ],
  }[state];
  return (
    <div className="learning-start">
      <h2>{copy[0]}</h2>
      <p>{copy[1]}</p>
      {(state === "join" || state === "inactive") && (
        <Link className="button button-primary" href="/ogrenci?bolum=siniflar">
          Sınıf koduyla katıl
        </Link>
      )}
      {state === "pending" && (
        <Link className="text-link" href="/ogrenci?bolum=siniflar">
          Katılma isteğini gör
        </Link>
      )}
    </div>
  );
}
export function TeacherStart({
  classes,
  members,
  assignments,
}: {
  classes: LearningClass[];
  members: MemberOption[];
  assignments: { id: string; class_id: string }[];
}) {
  const next = teacherStartStep(classes, members, assignments);
  const copy = {
    class: [
      "İlk sınıfınızı oluşturun",
      "Sınıfınıza özel katılım koduyla öğrencilerinizi davet edebilirsiniz.",
      "Sınıf oluştur",
    ],
    code: [
      "Katılım kodunu paylaşın",
      "Öğrenciler kodla katılma isteği gönderdikten sonra üyeliklerini onaylayabilirsiniz.",
      "Katılım koduna git",
    ],
    approve: [
      "Katılım isteklerini onaylayın",
      "Bekleyen öğrenciler, onayınızdan sonra ödev alabilir.",
      "Bekleyen öğrencileri gör",
    ],
    assign: [
      "İlk ödevinizi verin",
      "Onaylı öğrencileriniz hazır. Bir oyun ve alıcı grubu seçin.",
      "Ödev ver",
    ],
    report: [
      "Ödev sonuçlarını takip edin",
      "Öğrencilerinizin oyunlara başlama ve çalışma durumunu rapordan görebilirsiniz.",
      "Ödev sonuçlarını gör",
    ],
  }[next.step as "class" | "code" | "approve" | "assign" | "report"];
  return (
    <aside className="learning-start" aria-label="Sıradaki adım">
      <p className="form-help">Sıradaki adım</p>
      <h2>{copy[0]}</h2>
      <p>{copy[1]}</p>
      <Link className="button button-outline" href={next.href}>
        {copy[2]}
      </Link>
    </aside>
  );
}
