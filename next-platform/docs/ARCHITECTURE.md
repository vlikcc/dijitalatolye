# Arayüzler ve değişmezler

## HTTP

| Metot / yol | Yetki | Sonuç |
|---|---|---|
| POST `/api/contents` | doğrulanmış kullanıcı | metadata tamamlanmadan taslak oluşturur |
| POST `/api/contents/:id/versions` | içerik sahibi | streaming multipart: isteğe bağlı `metadata` JSON + tek `archive`; 202 ve versionId |
| GET `/api/contents/:id` | sahip / editör / yönetici | içerik ve sürüm durumu; no-store |
| POST `/api/versions/:id/entrypoint` | sahip | yalnızca taranmış adaylardan giriş seçer |
| POST `/api/versions/:id/thumbnail` | sahip | 5 MB raster, 20 MP decode limiti, güvenli WebP |
| POST `/api/versions/:id/preview` | sahip / editör / yönetici | sürüm/hash ile sınırlı 15 dakika JWT capability |
| POST `/api/versions/:id/decision` | 2FA editör / yönetici | sha256 + metadata revizyonu + approve/revise + gerekçe + çıkarılan kazanımlar |
| POST `/api/contents/:id/unpublish` | 2FA yönetici | yeni oyun isteklerini kapatır; bekleyen yayınları iptal eder |
| POST `/api/admin/retry/:id` | 2FA yönetici | güncel başarısız sürümü yeniden kuyruğa alır |
| POST `/api/admin/users/:id/role` | 2FA yönetici | rol değiştirir, oturumları siler; kendini değiştiremez |
| POST `/api/admin/taxonomy` | 2FA yönetici | ders/kazanım ekler, etkin/pasif yapar |
| POST `/api/admin/grades/:value` | 2FA yönetici | desteklenen 1–12 sınıf tanımlarını etkin/pasif yapar |
| GET `/api/internal/asset` | servis sırrı | Nginx için sürüm/origin/yol/yayın/token doğrulaması |
| GET `/api/health` | genel | DB erişimine bağlı 200/503 |

Kimlik uçları Better Auth `/api/auth/*` altında; e-posta doğrulama, parola yenileme ve 2FA dahildir. Cookie cache kullanılmaz; sahiplik ve rol kontrolleri her sunucu işleminde yapılır. Mutation Origin kontrolü uygulama origin'iyle tam eşleşme ister. Yükleme ve hassas kullanıcı işlemleri PostgreSQL rate limit kullanır; Better Auth tek web instance için kendi rate limitini uygular.

## Sürümler ve işler

Metadata ve yüklenen dosya hash'i içerik sürümüne bağlıdır; yeni dosya yeni sürümdür. İş ve sonuçlar `(versionId, sha256)` taşır. `draftVersionId` ile `publishedVersionId` bağımsızdır. pg-boss kuyruğa ekleme, Drizzle değişiklikleriyle aynı PostgreSQL client transaction'ında yapılır. Worker aynı sürümü session advisory lock ile tek seferde işler. Yayın dosyaları manifest hash'leriyle doğrulanır; dizin hazırlanması başarısızsa DB yayın referansı değişmez.

Tarama: queued → scanning → extracting / needs_entry; kesin paket hatası rejected, altyapı hatası scan_error. Statik çıkarım needs_metadata durumuna geçer; öğretmen bilgileri onaylayınca review oluşur. Çıkarım hatası elle devam etmeye izin verir; tarama hatası vermez. Karar revision_requested veya publishing'e gider. Yayın published; dosya hatası publish_error. Artık güncel olmayan iş superseded olur.

Süre aşımından sonra pg-boss işi tekrar alır; işin idempotent olması tekrar yayını önler. İptal/yayından kaldırma sırasında çalışan bir yayın işi DB'deki güncel state'i tekrar kontrol eder. Kopyalanmış fakat aktive edilmemiş dosyalar, Nginx yetkilendirmesi nedeniyle oynanamaz.

## Oyun sınırı

İçerik uygulama `public/` alanına girmez. Her sürüm `v-UUID.GAME_BASE_DOMAIN` origin'ine sahiptir; GAME_BASE_DOMAIN ana uygulamadan farklı kayıtlı kök domain olmalıdır. Nginx sadece read-only `ready` ve `published` volume'larını görür. Her dosya isteği için web servisine yetki sorgusu yapar; DB/web hatası erişimi kapatır. Cache no-store; doğrudan URL de aynı kontrolden geçer. Preview token'ları bearer capability'dir: erişimi olan kişi 15 dakika boyunca bağlantıyı paylaşabilir; URL ve capability loglanmaz.

iframe ve HTTP CSP aynı sandbox'ı uygular. `allow-scripts allow-same-origin` yalnızca ayrı, sürüme özel origin üzerinde kullanılır; uygulama ile aynı origin'de kullanılmamalıdır. Oyunlarda yerel kaynaklar ve local fetch serbest, harici kaynaklar/iframe/worker/form/popup/top navigation sınırlıdır. Standalone açılan kötü niyetli belgenin tüm davranışları için mutlak güvenlik iddiası yoktur; antivirüs ve statik analiz de güvenlik ispatı değildir. İndirilmiş veya bellekte çalışan oyunun baytları yayından kaldırmayla geri alınamaz.

## Bilinçli ilk sürüm sınırları

Tek web ve worker instance'ı, 60 sonuçlu katalog, 100 kullanıcı gösteren temel yönetim ekranı; pagination/ileri raporlama sonraki kapasite çalışmasıdır. Desteklenen 1–12 sınıf aralığı yönetimden etkin/pasif yapılır; yeni yüklemeler etkin sınıf gerektirir. Pasifleştirme mevcut yayınları kaldırmaz. Ders/kazanım tanımları eklenebilir ve pasifleştirilebilir. Paket için muhafazakâr statik JS sözleşmesi. Dinamik CDN veya sunucu kodu desteklenmez. Dosya depolama fonksiyonları local filesystem adaptöründe toplanmıştır; S3 adaptörü henüz yoktur. AI çağrısı yoktur. Statik teknik rapor ile öğretmen bilgileri ve kapak dondurulur; yapılandırılmış editör değerlendirmesi yayını onaylar. Scan/YARA kuralları ve imzaları bakım gerektirir.

Müfredat: sürümlenmiş katalog, kaynak, program, ünite, kazanım ve uygulama kayıtları. Kaynak doğrulaması kazanım fingerprint’i ve PDF hash’lerine bağlıdır. Detay: [CURRICULUM.md](CURRICULUM.md).

Müfredat ve kaynaklı metadata uçları, katalog sürümleme ve geçiş ayrıntıları [CURRICULUM.md](CURRICULUM.md) içindedir. Eski serbest kazanımlar yalnız geçmiş okumada korunur; yeni resmî ilişkiler katalog/sürüm kimliğiyle doğrulanır.

Teknik rapor, `render-cover`, kapak revizyonları ve editör değerlendirme sözleşmesi: [TECHNICAL-REVIEW.md](TECHNICAL-REVIEW.md).
