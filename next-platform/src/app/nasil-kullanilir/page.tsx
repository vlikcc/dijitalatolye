import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowDownRight,
  ArrowRight,
  Bookmark,
  Gamepad2,
  GraduationCap,
  Presentation,
  Search,
} from "lucide-react";
import { getAuth } from "@/server/auth";
import { learningEnabled } from "@/server/learning-feature";
import { can } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Nasıl kullanılır?",
  description:
    "Öğrenciler oyunları keşfeder, oynar ve öğrenir; öğretmenler sınıfları için oyun bulur ve hazırladıkları oyunları paylaşır.",
};

const studentSteps = [
  {
    icon: Search,
    title: "Merak ettiğin konuyu bul",
    description: "Sınıfını ve dersini seç ya da öğrenmek istediğin konuyu ara.",
  },
  {
    icon: Gamepad2,
    title: "Oyna, dene, öğren",
    description:
      "Bir oyun aç, yönergeleri takip et. İster evde ister sınıfta, kendi hızında keşfet.",
  },
  {
    icon: Bookmark,
    title: "Sevdiğin oyunları kaydet",
    description:
      "Yer imi düğmesiyle oyunları Kaydettiklerim'e ekle. Aynı tarayıcıdan yeniden açabilirsin.",
  },
];

const teacherSteps = [
  {
    title: "Oyununu yükle",
    description: "Hazırladığın oyunun HTML dosyasını veya ZIP paketini yükle.",
  },
  {
    title: "Bilgilerini tamamla",
    description:
      "Oyunun adını, açıklamasını, dersini ve sınıfını kontrol et. Varsa öğrenme hedefini ekle.",
  },
  {
    title: "İncelemeye gönder",
    description:
      "Güvenlik kontrollerini ve yayın incelemesini atölyenden takip et. Onaylanan oyunun katalogda yerini alsın.",
  },
];

export default async function Page() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  const learning = learningEnabled();
  const canShare = session && can(session.user.role, "create");
  return (
    <div className="usage-guide">
      <section
        className="usage-guide-heading"
        aria-labelledby="usage-guide-title"
      >
        <div className="usage-guide-intro">
          <h1 id="usage-guide-title">
            Oynayarak öğren,
            <br />
            <span className="catalog-title-highlight">birlikte keşfet.</span>
          </h1>
          <p>
            Öğrenciler için yeni konular keşfetmenin, öğretmenler için öğrenmeyi
            oyunla buluşturmanın yeri. Sınıfta da evde de sana uygun bir oyun
            var.
          </p>
          <Link className="button button-primary" href="/kesfet">
            Oyunları keşfet <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <p className="usage-guide-note">
            Oyunları keşfetmek ve oynamak için hesap gerekmez.
          </p>
        </div>
        <nav className="usage-guide-shortcuts" aria-label="Bu sayfada">
          <a href="#ogrenciler" className="usage-guide-shortcut">
            <span className="usage-guide-role-icon" aria-hidden="true">
              <GraduationCap size={24} />
            </span>
            <span>
              <strong>Öğrenciyim</strong>
              <span>Oyun bul, oyna ve öğren</span>
            </span>
            <ArrowDownRight size={20} aria-hidden="true" />
          </a>
          <a href="#ogretmenler" className="usage-guide-shortcut">
            <span className="usage-guide-role-icon" aria-hidden="true">
              <Presentation size={24} />
            </span>
            <span>
              <strong>Öğretmenim</strong>
              <span>Sınıfın için keşfet, oyununu paylaş</span>
            </span>
            <ArrowDownRight size={20} aria-hidden="true" />
          </a>
        </nav>
      </section>

      <div className="usage-guide-audiences">
        <section
          id="ogrenciler"
          className="usage-guide-audience"
          aria-labelledby="student-guide-title"
        >
          <h2 id="student-guide-title">Öğrenciler için</h2>
          <p className="usage-guide-summary">Bir konu seç, oyuna başla.</p>
          <ol className="usage-guide-steps">
            {studentSteps.map(({ icon: Icon, title, description }) => (
              <li key={title}>
                <span className="usage-guide-step-marker" aria-hidden="true">
                  <Icon size={19} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="usage-guide-next">
            {learning && (!session || session.user.role === "student") ? (
              <>
                <p>
                  Öğretmenin bir sınıf kodu verdiyse öğrenci hesabınla sınıfına
                  katıl, ödevlerini takip et. Kayıt için e-posta gerekmez.
                </p>
                <div className="usage-guide-actions">
                  {session ? (
                    <Link className="button button-outline" href="/ogrenci">
                      Öğrenci atölyeme git{" "}
                      <ArrowRight size={17} aria-hidden="true" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        className="button button-outline"
                        href="/kayit?tur=ogrenci"
                      >
                        Öğrenci hesabı oluştur
                      </Link>
                      <Link className="text-link" href="/giris?next=%2Fogrenci">
                        Öğrenci girişi{" "}
                        <ArrowRight size={17} aria-hidden="true" />
                      </Link>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <p>
                  Keşfetmeye hemen başlayabilirsin. Kaydettiğin oyunlar bu
                  tarayıcıda seni bekler.
                </p>
                <Link className="text-link" href="/kesfet?saved=1">
                  Kaydettiklerime git{" "}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        </section>

        <section
          id="ogretmenler"
          className="usage-guide-audience"
          aria-labelledby="teacher-guide-title"
        >
          <h2 id="teacher-guide-title">Öğretmenler için</h2>
          <p className="usage-guide-summary">
            Sınıfın için oyun bul, kendi oyununu paylaş.
          </p>
          <ol className="usage-guide-steps">
            {teacherSteps.map(({ title, description }, index) => (
              <li key={title}>
                <span
                  className="usage-guide-step-marker usage-guide-step-number"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="usage-guide-next">
            <p>
              Paylaştığın oyunlar öğrencilerin hem sınıfta hem de kendi
              başlarına öğrenmesine katkı sağlasın.
            </p>
            {!session || canShare ? (
              <div className="usage-guide-actions">
                <Link
                  className="button button-outline"
                  href={
                    canShare
                      ? "/ogretmen/yeni"
                      : "/giris?next=%2Fogretmen%2Fyeni"
                  }
                >
                  {canShare ? "Oyun paylaş" : "Paylaşmak için giriş yap"}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                {!session && (
                  <Link
                    className="text-link"
                    href="/kayit?next=%2Fogretmen%2Fyeni"
                  >
                    Öğretmen hesabı oluştur
                  </Link>
                )}
              </div>
            ) : (
              <p className="usage-guide-note">
                Oyun yüklemek için öğretmen veya yönetici hesabı gerekir.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
