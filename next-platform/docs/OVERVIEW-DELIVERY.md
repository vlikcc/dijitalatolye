# Platform özeti teslim kaydı

27 Ekim 2026 — **Son inceleme kararı: Ship.** İncelenen kapsamda teslimi engelleyen bulgu yok. [İnceleme raporu](../.impeccable/review/overview/finish-review.md).

`/ozet`, ekip içinde bağlantıyla paylaşılabilen “Bir bakışta atölye” sayfasıdır. Oyun yükleme, otomatik teknik kontrol, insan tarafından inceleme ve yayın akışını; öğrenci kaydı, sınıf kabulü, ödev ve takip sınırlarını Türkçe özetler. Roller ve önemli koşullar dört açılır ayrıntı bölümünde açıklanır.

Sayfa menülerde listelenmez; hesabı olmayan ziyaretçiler de okuyabilir. `noindex`/`nofollow` tanımlıdır; bu, gizlilik veya erişim kontrolü sağlamaz. Öğrenci, sınıf ve ödev özelliklerinin kullanılabilirliği mevcut `learningEnabled()` sonucuna göre açıklanır. Ortam ayarları değiştirilmemiştir.

“Bağlantıyı kopyala” sonucu işlem tamamlanınca bildirir; kopyalama başarısızsa seçilebilir bağlantı alanı açılır. “Yazdır / PDF”, kapalı ayrıntılar dahil tüm içeriği yazdırır. Kayıtlı A4 çıktı dört sayfadır.

Uygulama yalnız `src/app/ozet/page.tsx`, `overview-actions.tsx` ve `overview.module.css` içindedir. Mevcut Keşif Atlası renkleri, yazı karakterleri, ortak kabuk ve denetimler kullanılır. Yeni görsel varlık veya tasarım sistemi değişikliği yoktur; `DESIGN.md` ve `.impeccable/design.json` korunmuştur. 22px giriş metnine ilişkin tek araç önerisi, belgelenmiş mevcut ölçüyle uyumlu ve incelemede engel oluşturmayan yerel bir tercih olarak değerlendirilmiştir.

Doğrulama kaydı:

- TypeScript ve biçim denetimleri uygulayıcı tarafından başarılı bildirildi.
- [verification.json](../.impeccable/review/overview/verification.json): 320/390/768/1440px taşma kontrolü; anonim erişim, indeksleme metadatası, menüden dışlama, kopyalama başarı/hata yolu, klavye odağı ve açılır ayrıntılar, yazdırma işlemi. Kaydedilen sayfa hatası yok.
- [İnceleme kanıtları](../.impeccable/review/overview/): `desktop.png`, `mobile.png`, `mobile-expanded.png`, `mobile-copy-fallback.png`, `print-1.png`–`print-4.png` ve `overview.pdf`.

Bu kayıt mevcut kaynakları, yön sözleşmesini, inceleme kararını ve doğrulama kayıtlarını esas alır; ek arayüz değişikliği veya test çalıştırılmamıştır. Kontroller bu sayfayla sınırlıdır; tüm tarayıcılar veya yardımcı teknolojiler için genel uygunluk iddiası içermez. Dağıtım yapılmamıştır.
