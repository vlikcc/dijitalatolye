# Ortak uygulama deneyimi — 27 Ekim 2026

Kullanıcının onayladığı Keşif Atlası yönü; keşif, oyun detayı, hesap ve rol çalışma alanlarına genişletildi. Nötr zemin (`#F6F7F9`), lacivert metin/eylemler (`#24344D`), beyaz kontroller, yerel Manrope başlıkları ve Source Sans 3 arayüz yazıları ortaktır. Kâğıt dokusu yalnız keşif, oyun ve hesap girişlerinde kullanılır; çalışma alanları düz, footer kısa ve açıktır. Ders renkleri, oyun içi görseller, özgün puzzle pikselleri ve belge başına bir kez çalışan hareket korunur. Normatif tokenlar [DESIGN.md](../DESIGN.md), bileşen örnekleri [design.json](../.impeccable/design.json), onaylanan kapsam [yüzey sözleşmesi](../.impeccable/surfaces/src-app-globals-css.md) içindedir.

Oyun detayında kısa geri bağlantısı, 32/28px başlık, kaydet/paylaş araçları ve tek metadata satırından sonra ortalanmış oynatıcı gelir. Bilgi yan sütunu ve tekrarlanan başlatma eylemi kaldırıldı. Standart, sinema ve tam ekran aynı iframe'i ve ilerlemeyi korur. Çalışma alanında masaüstü görev menüsü, 1100px altında etiketli Menü içine taşınır; seçili görev görünür. İnceleme ve kayıt sekmeleri alanları bağlı tutarak taslakları korur. Admin listeleri yalnız seçili bölümün verisini sunucuda arar ve sayfalar.

## Roller ve yetkiler

Görünen adlar değişse de saklanan rol kodları değişmedi. [Merkezî yetki politikası](../src/lib/permissions.ts) menü, sayfa koruması ve API yetkilendirmesinde kullanılır; kayıt sahipliği ayrıca denetlenir.

| Görünen rol / kod | Çalışma alanı | Yetkiler ve sınırlar |
| --- | --- | --- |
| Öğrenci / `student` | `/ogrenci` | Kendi ödevleri, kayıt destekli oyunları, sınıfları ve hesabı. Ödev/ilerleme erişimi kendi hesabıyla sınırlı. |
| Öğretmen / `teacher` | `/ogretmen` | Kendi oyunlarını yükleme/düzenleme, tarama ve inceleme durumunu görme; sınıf, üyelik, ödev ve rapor; sorumlu olduğu öğrencinin kurtarma kodu. Yayın onaylayamaz. |
| Yönetici / `editor` | `/editor` | Öğretmen yetkileri ve inceleme kuyruğu. Zorunlu teknik/eğitsel değerlendirmeyi tamamlayarak yayın kararı verir; kendi uygun gönderisini de aynı açık değerlendirmeden geçirerek onaylayabilir. Güvenlik engellerini aşamaz. |
| Admin / `admin` | `/yonetim` | Kullanıcılar, tanımlar, yayınların incelenmesi/yayından kaldırılması, sistem işlemleri, işlem kayıtları ve açık kurtarma devralması. Oyun üretemez/düzenleyemez, sınıf/ödev yönetemez, yayın onaylayamaz. |

Öğrenci, Ödevler (`/ogrenci`), Oyunlar (`?bolum=oyunlar`), Sınıflar (`?bolum=siniflar`) ve Hesap (`/hesap`) arasında seçim yapar. Yönetici öğretmen görevlerine de erişir. Admin bölümleri Kullanıcılar, Tanımlar, Yayınlar, Sistem işlemleri ve İşlem kayıtlarıdır. Katalogdaki oyun paylaşma daveti ve footer bağlantısı anonim ziyaretçi veya içerik oluşturabilen hesaba gösterilir.

## Giriş, kayıt ve geri dönüş

- Ortak `/giris` alanı e-posta veya öğrenci kullanıcı adını kabul eder. Öğretmen kayıtları e-posta doğrulaması ister; Yönetici ve Admin için 2FA koşulu korunur. Doğrulama bağlantısını yeniden gönderme, parola görünürlüğü, hata mesajı ve tekrar gönderim engeli ortak formda bulunur.
- `/kayit`, öğrenme özelliği açıkken klavyeyle kullanılan Öğretmen/Öğrenci sekmelerini gösterir. Öğrenci doğrudan `/kayit?tur=ogrenci` adresine gider; görünen ad, kullanıcı adı, parola ve sınıf kodu kullanır, e-posta toplanmaz.
- `/ogrenci/giris` → `/giris`; `/ogrenci/kayit` → `/kayit?tur=ogrenci`. Eski bağlantıların metin sorgu parametreleri korunur.
- `next` hedefi giriş/kayıt, doğrulama ve kurtarma bağlantılarında taşınır. `/oturum` rol ve doğrulama koşullarını denetleyip `safeReturn` ile yalnız izinli yerel hedefe döner. Dış adresler, kodlanmış yol hileleri veya role uygun olmayan hedefler rol ana sayfasına düşer; hedef kaydın sahiplik denetimi ayrıca yapılır.
- Öğrenci kurtarmasında ilk üyeliği onaylayan öğretmen/Yönetici sorumludur. Admin sorumluluğu açıkça devralabilir; bu işlem içerik veya öğretmenlik yetkisi kazandırmaz. Öğrenci SDK/ilerleme sözleşmesi [STUDENT-LEARNING.md](STUDENT-LEARNING.md) içinde korunur.

## Doğrulama ve sınırlar

[Uygulayıcı doğrulama kaydı](../.impeccable/review/unified/verification.md) TypeScript, üretim derlemesi, 9 dosyada 59 birim testi ve 4 dosyada 29 entegrasyon testinin geçtiğini kaydeder. Entegrasyon testleri ayrılmış PostgreSQL veritabanlarında gerçek yerel ClamAV/YARA tarama ve worker hattıyla yürütüldü. Toplam **55 farklı tarayıcı senaryosu** geçti: ilk toplu çalışmada 46, kalan dokuz senaryo test verisi/hazır olma düzeltmelerinden sonra geçti. Sonraki odaklı tekrarlar bu toplamın üzerine yeni benzersiz senaryo olarak eklenmez.

Kapsam; 16 demo oyunun tamamlanması/yeniden başlatılması, arama/filtre/geçmiş/kaydetme, dört rol ve 2FA, doğrulama/kurtarma, eski bağlantılar, taslak koruma, parola görünürlüğü, Admin arama/sayfalama/devralma ve yetkisiz API retleri, Yönetici öz-yayını için zorunlu inceleme, gerçek yükle→tara→metadata/kapak→değerlendir→yayınla→geri al/yeni sürüm hattı ve sınıf→ödev→ikinci cihazdan devam→rapor akışını içerir.

320/390/600/768/1024/1440px genişlikleri, çalışma alanında %200 CSS zoom eşdeğeri yeniden akış, klavye, yatay oyun, ekran yönü, azaltılmış hareket, JavaScript kapalı logo ve eksik doku denetlendi. 1440×900'de ilk dört kart, 390×844'te ilk görsel/başlık görünür. Kontroller Chromium/macOS üzerinde yürütüldü; çapraz tarayıcı veya ekran okuyucu sertifikası değildir.

Varsayılan düğme ve form alanlarının minimum yüksekliği 46px'tir; kompakt varyantlar kendi ölçülerini kullanır. İncelemenin istediği kompakt ailede küçük düğme, menü, masaüstü gezinme, öğretmen giriş, kart kaydetme ve parola görünürlüğü hedefleri kaynakta en az 44px'e düzeltildi. Bu kayıt bütün bağlantı ve açıklamaların 44px olduğuna dair genel bir iddia içermez.

Bağımsız inceleme, 40 zorunlu görüntü ve ilgili kaynak üzerinden bir gruplanmış kompakt hedef boyutu düzeltmesi istedi (`fix`). [Son dar kapsamlı karar](../.impeccable/review/unified/finish-verdict.md) bu bulguyu **çözüldü / ship** olarak kapatır; düzeltme görüntülerinde veya ilgili kaynakta yeni gerileme gözlenmedi. Bu karar tek puanlanan düzeltmeye aittir, yeni bir sınırsız tüm-ürün denetimi değildir. [İlk inceleme](../.impeccable/review/unified/finish-review.md) korunur; incelemeci uygulayıcının test sonuçlarını yeniden çalıştırmadığını açıkça belirtir. Önceki yakalama düzeltmesi bir tasarım onayı değildir.

Son boyut düzeltmesinden sonra üretim derlemesi yeniden geçti. Etkilenen **11 senaryonun tamamı** odaklı tekrarlarda geçti: ilk çalışmada 10, son öğrenme tekrarında 1 (57,3 saniye). Son öğrenme çalışması, yazı tipi/yerleşim hazır olduktan sonra işaretçi etkileşimlerini ve aktif oynatıcının boyut değişimi kaynaklı kaydırması bittikten sonra tam sayfa yakalamayı kullandı. Uygulayıcı güncel 390px oyuncu ve rapor görüntülerinde tek header, gerçek footer ve yinelenmeyen yakalamayı doğruladı. Bunlar mevcut 55 senaryonun tekrarlarıdır.

## Temsilî ekran kanıtları

| Yüzey | Masaüstü | Mobil |
| --- | --- | --- |
| Keşif | [1440px](../.impeccable/review/unified/home-1440.png) | [390px](../.impeccable/review/unified/home-390.png) |
| Oyun detayı | [1440px](../.impeccable/review/unified/game-1440.png) | [390px](../.impeccable/review/unified/game-390.png) |
| Ortak giriş | [1440px](../.impeccable/review/unified/login-1440.png) | [390px](../.impeccable/review/unified/login-390.png) |
| Kayıt sekmeleri | [1440px](../.impeccable/review/unified/registration-1440.png) | [390px](../.impeccable/review/unified/registration-390.png) |
| Öğretmen | [1440px](../.impeccable/review/unified/teacher-1440.png) | [390px](../.impeccable/review/unified/teacher-390.png) |
| Öğrenci | [1440px](../.impeccable/review/unified/student-1440.png) | [390px](../.impeccable/review/unified/student-390.png) |
| Yönetici | [1440px](../.impeccable/review/unified/editor-1440.png) | [390px](../.impeccable/review/unified/editor-390.png) |
| Admin | [1440px](../.impeccable/review/unified/admin-1440.png) | [390px](../.impeccable/review/unified/admin-390.png) |
| Ödev raporu | [1440px](../.impeccable/review/learning-report-1440.png) | [390px](../.impeccable/review/learning-report-390.png) |
| Teknik inceleme | [1440px](../.impeccable/review/technical-editor-1440.png) | [390px](../.impeccable/review/technical-editor-390.png) |

Tam görüntü envanteri [inceleme paketindedir](../.impeccable/review/unified/review-packet.md). Mobil raporun ilk compositor/tiling kaynaklı tekrar eden yakalaması, yerleşim kararlı hâle geldikten sonra yenilendi; güncel görüntü tek header ve gerçek footer içerir. Test adları ve katalogdaki tekrarlar sentetik yerel kayıtlardır, gerçek kullanıcı veya kullanım sayısı değildir. Belgeleme aşaması yeni görüntü üretmedi ve taramayı tekrar çalıştırmadı.

Doğrulama yalnız `dijital_unified_test` ve `dijital_unified_integration_test`, yerel Mailpit ve ayrı worker/oyun origin'i kullandı. Üretim çıktısı `http://localhost:3100/`, mevcut yerel verili geliştirme önizlemesi `http://localhost:3001/` üzerinden kontrol edildi. Kontrol tamamlanınca 3100 test sunucusu ve ona ait worker/58082 oyun servisi durduruldu; mevcut 3001 geliştirme önizlemesi ve 58083 oyun servisi açık kaldı. Üretim dağıtımı, canlı veri/rol taşıması veya sahiplik devri yapılmadı. `STUDENT_LEARNING_ENABLED=false` üretim varsayılanı korunur; test fikstürleri yerel kayıtlardan ayrıdır.
