export type ProgressVersion = {
  id: string;
  state: string;
  revokedAt?: Date | string | null;
};
export type StepStatus =
  "complete" | "current" | "waiting" | "error" | "attention" | "inactive";
export const PUBLICATION_STEPS = [
  "Dosya",
  "Güvenlik",
  "Bilgiler",
  "İnceleme",
  "Yayın",
] as const;
type Stage = {
  index: number;
  title: string;
  description: string;
  label: string;
  status?: "error" | "attention";
  action?: { href: string; label: string };
};
const stages: Record<string, Stage> = {
  queued: {
    index: 1,
    title: "Güvenlik taraması sırada",
    description:
      "Oyun dosyanız kaydedildi. Tarama başladığında durum burada güncellenecek.",
    label: "Sırada",
  },
  scanning: {
    index: 1,
    title: "Güvenlik taraması sürüyor",
    description:
      "Oyun paketi kontrol ediliyor. Şu anda işlem yapmanız gerekmiyor.",
    label: "Taranıyor",
  },
  scan_error: {
    index: 1,
    title: "Güvenlik taraması tamamlanamadı",
    description:
      "Dosyanız kaydedildi ancak tarama bir hatayla durdu. Ayrıntıları aşağıdan kontrol edin; yeniden deneme zamanı henüz belli değil.",
    label: "Tarama hatası",
    status: "error",
  },
  rejected: {
    index: 1,
    title: "Oyun paketi kabul edilmedi",
    description:
      "Aşağıdaki hata açıklamasına göre paketi düzeltip yeni bir sürüm yükleyin.",
    label: "Kabul edilmedi",
    status: "error",
  },
  needs_entry: {
    index: 2,
    title: "Oyunun giriş dosyasını seçin",
    description:
      "Paket içinde birden fazla başlangıç adayı var. Oyunu açacak HTML dosyasını aşağıdan seçin.",
    label: "Seçiminiz bekleniyor",
    status: "attention",
    action: { href: "#entrypoint-heading", label: "Giriş dosyasını seç" },
  },
  extracting: {
    index: 2,
    title: "Oyun bilgileri hazırlanıyor",
    description:
      "Başlık, açıklama ve ders bilgileri paketten okunuyor. Ardından bilgileri kontrol edebileceksiniz.",
    label: "Hazırlanıyor",
  },
  needs_metadata: {
    index: 2,
    title: "Oyun bilgilerini kontrol edin",
    description:
      "Başlık, açıklama, ders ve kazanımları tamamlayıp oyunu incelemeye gönderin. Taslağınızı kaydedip daha sonra devam edebilirsiniz.",
    label: "Kontrolünüz bekleniyor",
    status: "attention",
    action: { href: "#metadata-heading", label: "Bilgileri kontrol et" },
  },
  review: {
    index: 3,
    title: "Yönetici incelemesi bekleniyor",
    description:
      "Oyun incelemeye gönderildi. Yönetici kararı burada görünecek.",
    label: "İncelemede",
  },
  revision_requested: {
    index: 3,
    title: "Oyununuz için düzeltme istendi",
    description:
      "Yöneticinin notunu okuyun. İstenen düzeltmeleri mevcut düzenleme veya yeni sürüm yükleme işlemiyle yapın.",
    label: "Düzeltme bekleniyor",
    status: "attention",
  },
  publishing: {
    index: 4,
    title: "Yayın hazırlanıyor",
    description:
      "İnceleme tamamlandı. Oyun yayın için hazırlanıyor; yayın kaydı oluştuğunda burada görünecek.",
    label: "Hazırlanıyor",
  },
  publish_error: {
    index: 4,
    title: "Yayınlama tamamlanamadı",
    description:
      "Yayın hazırlanırken bir hata oluştu. Ayrıntıları aşağıdan kontrol edin; tamamlanma zamanı henüz belli değil.",
    label: "Yayınlama hatası",
    status: "error",
  },
};

/** Shared by the SQL list predicate and the presentation model. */
export const PUBLICATION_ATTENTION_STATES = Object.entries(stages)
  .filter(
    ([, stage]) => stage.status === "attention" || stage.status === "error",
  )
  .map(([state]) => state);

export function isLiveVersion(
  version: ProgressVersion | null | undefined,
  publishedVersionId: string | null | undefined,
): boolean {
  return (
    !!version &&
    !!publishedVersionId &&
    version.id === publishedVersionId &&
    version.state === "published" &&
    !version.revokedAt
  );
}

/** Describes current server facts, not a fabricated event history. Unknown/retired states have no active step. */
export function getPublicationProgress({
  version,
  publishedVersionId,
  publishedVersion,
  uploadPhase = "empty",
}: {
  version?: ProgressVersion | null;
  publishedVersionId?: string | null;
  publishedVersion?: ProgressVersion | null;
  uploadPhase?:
    "empty" | "ready" | "preparing" | "uploading" | "saving" | "cover";
} = {}) {
  const live = isLiveVersion(version, publishedVersionId);
  const previousPublicationLive =
    !live && isLiveVersion(publishedVersion, publishedVersionId);
  let current: Stage | undefined;
  let title = "Durum doğrulanamadı";
  let description =
    "Bu sürümün durumu tanınmıyor. Sayfayı yenileyerek tekrar kontrol edin.";
  if (!version) {
    const copy = {
      empty: [
        "Oyun dosyasını seçin",
        "HTML veya ZIP dosyanızı seçin; hazır olduğunuzda yüklemeyi başlatın.",
        "Dosya bekleniyor",
      ],
      ready: [
        "Dosyanız yüklemeye hazır",
        "Dosyanızı kontrol edip aşağıdaki düğmeyle yüklemeyi başlatın.",
        "Hazır",
      ],
      preparing: [
        "Yükleme kaydı hazırlanıyor",
        "Dosya aktarımı için içerik kaydı hazırlanıyor.",
        "Başlatılıyor",
      ],
      cover: [
        "Oyun dosyanız kaydedildi",
        "İsteğe bağlı kapak ekleniyor. Ardından içerik ekranına geçeceksiniz.",
        "Dosya kaydedildi",
      ],
      uploading: [
        "Oyun dosyası aktarılıyor",
        "Gerçek aktarım ilerlemesini aşağıdan takip edebilirsiniz.",
        "Aktarılıyor",
      ],
      saving: [
        "Sunucuya kaydediliyor",
        "Aktarım tamamlandı. Sunucunun kaydı doğrulaması bekleniyor.",
        "Kaydediliyor",
      ],
    }[uploadPhase];
    current = {
      index: 0,
      title: copy[0],
      description: copy[1],
      label: copy[2],
    };
  } else if (version.revokedAt) {
    title = "Bu sürümün yayını iptal edildi";
    description =
      "Bu sürüm yayında değil. Devam etmek için yeni bir sürüm yükleyebilirsiniz.";
  } else if (version.state === "superseded") {
    title = "Bu, eski bir sürüm";
    description =
      "Yerine yeni bir sürüm oluşturuldu. Bu sürüm etkin bir işlem veya mevcut yayın olarak gösterilmiyor.";
  } else if (version.state === "published") {
    title = live ? "Oyununuz yayında" : "Bu sürüm yayında değil";
    description = live
      ? "Oyun yayınlandı. Yayındaki oyunu bağlantısından açabilirsiniz."
      : "Bu sürüm içerikteki mevcut yayın kaydıyla eşleşmiyor.";
  } else {
    // Do not interpret inherited property names as server states.
    current = Object.hasOwn(stages, version.state)
      ? stages[version.state]
      : undefined;
  }
  if (current) ({ title, description } = current);
  return {
    title,
    description,
    live,
    previousPublicationLive,
    tone: current?.status ?? "neutral",
    action: current?.action,
    steps: PUBLICATION_STEPS.map((label, index) => {
      let status: StepStatus = "inactive";
      let detail = "Etkin değil";
      if (live) {
        status = "complete";
        detail = index === 4 ? "Yayında" : "Tamamlandı";
      } else if (current) {
        status =
          index < current.index
            ? "complete"
            : index === current.index
              ? (current.status ?? "current")
              : "waiting";
        detail =
          index < current.index
            ? "Tamamlandı"
            : index === current.index
              ? current.label
              : "Bekliyor";
      }
      return {
        label,
        status,
        detail,
        current: index === current?.index || (live && index === 4),
      };
    }),
  };
}
export type PublicationProgress = ReturnType<typeof getPublicationProgress>;
