import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { learningEnabled } from "@/server/learning-feature";
import { OverviewActions } from "./overview-actions";
import styles from "./overview.module.css";

export const metadata: Metadata = {
  title: "Bir bakışta atölye",
  description:
    "Bir oyunun yüklemeden yayına yolculuğu; öğretmen, editör ve öğrenci rolleri, sınıflar ve ödevler hakkında kısa bir özet.",
  robots: { index: false, follow: false },
};

const publicationSteps = [
  {
    title: "Öğretmen yükler",
    description:
      "Öğretmen e-posta adresiyle kayıt olur, hesabını doğrular ve oyununu HTML veya ZIP olarak yükler. Dosya önce özel bir alana alınır; henüz kimseye yayımlanmaz.",
  },
  {
    title: "Sistem kontrol eder",
    description:
      "Zararlı dosyalar, paket yapısı, eksik veya dışarıdan çağrılan kaynaklar ve kod kuralları denetlenir. Güvenlik engeli varsa süreç durur; editör bu engeli aşamaz.",
  },
  {
    title: "Öğretmen bilgileri tamamlar",
    description:
      "Dosyadan çıkarılabilen bilgileri kontrol eder; başlık, açıklama, ders, sınıf ve varsa kazanımları düzenler. Kapağını seçer veya otomatik bilgi kapağını kullanır, incelemeye gönderir.",
  },
  {
    title: "Editör inceler",
    description:
      "Teknik raporu okur, oyunu oynar; bilimsel doğruluk, yaş ve sınıf düzeyi, eğitimsel değer, erişilebilirlik, kapak ve kazanım uyumunu değerlendirir. Uygunsa onaylar; eksikse gerekçesiyle düzeltme ister.",
  },
  {
    title: "Oyun yayımlanır",
    description:
      "Son dosya kontrollerinden sonra oyun kataloğa açılır. Öğretmen süreci panelinden izler. Yeni sürüm de incelemeden geçer; onaylanana kadar önceki yayın korunur.",
  },
];

const classroomSteps = [
  {
    title: "Sınıfı kur",
    description: "Öğretmen sınıf oluşturur ve katılım kodunu paylaşır.",
  },
  {
    title: "Öğrenciyi kabul et",
    description:
      "Öğrenci ad, kullanıcı adı, parola ve sınıf koduyla kayıt olur; e-posta gerekmez. Sınıf üyeliğini öğretmen onaylar. Ortak giriş ekranında öğrenci kullanıcı adını, öğretmen e-postasını kullanır.",
  },
  {
    title: "Oyunla ödev ver",
    description:
      "Öğretmen yayımlanmış bir oyunu yönerge ve son tarihle tüm sınıfa veya seçtiği öğrencilere atar. Öğrenci ödevini kendi panelinden açar.",
  },
  {
    title: "Sonuçları takip et",
    description:
      "Uyumlu oyunlarda ilerleme, puan, tamamlanma ve cihazlar arası devam desteklenir. Öğretmen ödev sonuçlarını görür, CSV veya yazdır/PDF çıktısı alabilir; ödevleri yeniden kullanabilir.",
  },
];

const roles = [
  ["Öğrenci", "Oyun oynar, sınıfına katılır ve kendi ödevlerini takip eder."],
  [
    "Öğretmen",
    "Oyun yükler; sınıflarını, üyelikleri, ödevleri ve raporları yönetir.",
  ],
  [
    "Editör · Yönetici",
    "Öğretmen yetkilerine ek olarak oyunları inceler ve yayın kararı verir. Ekrandaki rol adı Yönetici’dir.",
  ],
  [
    "Admin",
    "Kullanıcıları, tanımları ve sistemi yönetir; gerektiğinde yayını kaldırır. Oyun onaylama, sınıf kurma ve ödev verme yetkisi yoktur.",
  ],
];

const details = [
  {
    title: "Yükleme ve kazanımlar",
    paragraphs: [
      "HTML veya ZIP yüklemesi en fazla 50 MB olabilir. Görsel, ses ve gerekli dosyalar pakette bulunmalı; dış sitelerden kaynak veya servis çağrıları desteklenmez.",
      "Kazanım eklemek zorunlu değildir. Eklenirse hem kaynağı hem de oyundaki görevle ilişkisi incelenir. Müfredat kataloğu henüz tüm sınıf ve dersler için eksiksiz değildir. Demo etiketli örnekler, onaylanmış öğretmen oyunlarından ayrıdır ve ödev olarak atanamaz.",
    ],
  },
  {
    title: "Kayıt, puan ve gizlilik",
    paragraphs: [
      "İlerleme ve puan için oyunun platformun kayıt desteğine uyarlanması gerekir. Diğer oyunlarda yalnız açılma bilgisi izlenir; oyunu açmak tamamlamak sayılmaz. Soru bazında cevap analizi yoktur; oyun puanları resmî sınav veya notlandırma sistemi değildir.",
      "Kaydettiklerim favorileri aynı tarayıcıda tutar; hesaba bağlı oyun ilerlemesi ayrı bir özelliktir. Öğretmen yalnız verdiği ödevlerin sonuçlarını görür, öğrencinin serbest oyun geçmişini göremez. Parolasını unutan öğrenciye sorumlu öğretmen kurtarma kodu sağlayabilir.",
    ],
  },
  {
    title: "Ödevler ve oyun güncellemeleri",
    paragraphs: [
      "Son tarih geçince ödev gecikmiş olarak işaretlenir; öğretmen kapatana kadar çalışma sürebilir. Sınıfa sonradan katılan öğrenciler mevcut ödevlere ayrıca eklenir.",
      "Her ödev atandığı oyun sürümünde kalır; yeni yayın öğrencinin çalışmasını değiştirmez. Bir oyun yayından kaldırılırsa eski ödev ve oyun oturumlarının erişimi de kapanır; geçmiş sonuçlar korunur.",
    ],
  },
  {
    title: "Onay yetkileri ve hesap güvenliği",
    paragraphs: [
      "Öğretmen yayın onayı veremez. Editör kendi oyununu da aynı zorunlu değerlendirmeyi tamamlayarak onaylayabilir; ikinci bir editör onayı şartı bulunmaz. Yönetici ve Admin hesaplarında iki aşamalı doğrulama gerekir.",
      "Bu özet menüde listelenmez; bağlantıyı bilen herkes hesabı olmadan okuyabilir.",
    ],
  },
];

export default function OverviewPage() {
  const learning = learningEnabled();

  return (
    <article className={styles.overview} aria-labelledby="overview-title">
      <header className={styles.intro}>
        <h1 id="overview-title">Bir bakışta atölye</h1>
        <p className={styles.lead}>
          Öğretmenin ürettiği oyun, incelemeden geçer, öğrenciye ulaşır.
        </p>
        <p>
          Dijital Oyun Atölyesi; eğitici oyunların paylaşıldığı, teknik ve
          eğitimsel açıdan incelendiği, sınıfta veya evde kullanıldığı bir
          platform. Oyunları keşfetmek ve oynamak için hesap gerekmez.
        </p>
        <OverviewActions />
      </header>

      <section className={styles.section} aria-labelledby="publication-title">
        <h2 id="publication-title">Bir oyun nasıl yayımlanır?</h2>
        <ol className={styles.journey}>
          {publicationSteps.map((step, index) => (
            <li key={step.title}>
              <span className={styles.stepNumber} aria-hidden="true">
                {index + 1}
              </span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
        <p className={styles.note}>
          <strong>Teknik kontrol otomatik, eğitimsel karar insanın.</strong>{" "}
          Mevcut sürümde yapay zekâ ile yayın onayı verilmez. Düzeltme istenen
          oyun, öğretmen tarafından düzenlenip yeniden incelemeye gönderilir.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="classroom-title">
        <div className={styles.sectionHeading}>
          <h2 id="classroom-title">Sınıftan ödeve, ödevden takibe</h2>
          <p className={styles.availability}>
            {learning
              ? "Bu ortamda öğrenci, sınıf ve ödev özellikleri açık."
              : "Bu ortamda öğrenci, sınıf ve ödev özellikleri henüz açık değil. Aşağıdaki akış etkinleştirildiğinde kullanılabilir."}
          </p>
        </div>
        <ol className={styles.classroom}>
          {classroomSteps.map((step) => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
        <p className={styles.note}>
          <strong>Takip kapsamı oyuna bağlıdır.</strong> Kayıt desteği olmayan
          oyunlarda yalnız açılma bilgisi görülür. Puan ve kaldığı yerden devam
          her oyunda otomatik olarak bulunmaz.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="roles-title">
        <h2 id="roles-title">Kim, ne yapar?</h2>
        <dl className={styles.roles}>
          {roles.map(([role, description]) => (
            <div key={role}>
              <dt>{role}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="details-title">
        <h2 id="details-title">Bilinmesi gerekenler</h2>
        <p className={styles.sectionDescription}>
          İhtiyacın olan başlığı açarak ayrıntısını okuyabilirsin.
        </p>
        <div className={styles.details}>
          {details.map((detail) => (
            <details key={detail.title}>
              <summary>
                {detail.title}
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <div className={styles.detailBody}>
                {detail.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <footer className={styles.closing}>
        <p>
          Öğretmen üretir. Sistem kontrol eder. Editör değerlendirir. Öğrenci
          oynayarak öğrenir.
        </p>
        <Link className="text-link" href="/kesfet">
          Oyunları keşfet <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
}
