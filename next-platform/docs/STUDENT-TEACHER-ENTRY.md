# Öğrenci ve öğretmen için ortak giriş

27 Ekim 2026. Öğretmen paylaşımını merkeze alan tanıtım, öğrencilerin doğrudan oyun bulup oynayabildiğini de anlatan ortak bir rehbere dönüştürüldü.

- Misafir üst menüsü ve alt menüde “Nasıl kullanılır?” `/nasil-kullanilir` sayfasına gider. Eski `/ogretmenler-icin` bağlantısı bu rehbere yönlenir.
- “Oynayarak öğren, birlikte keşfet.” başlığının ana eylemi oyun kataloğunu açar. Öğrenci ve öğretmen bölümleri masaüstünde yan yana, mobilde öğrenci bölümü önce gelecek şekilde sıralanır.
- Öğrenci bölümü konu bulma, oynama ve tarayıcıya kaydetmeyi açıklar. Öğrenci hesabı etkinse kayıt bağlantısı doğrudan öğrenci sekmesini açar; mevcut öğrenciler kendi atölyelerine ulaşır. Öğrenci girişinden kayıt ekranına geçiş de öğrenci seçimini korur.
- Öğretmen bölümü yükleme, bilgi tamamlama ve inceleme adımlarını açıklar. Oyun oluşturma bağlantıları mevcut rol politikasını kullanır.
- Katalog, ortak hesap ekranı ve sayfa açıklaması evdeki ve sınıftaki kullanımı kapsar. Katalogda iki kitle için ayrı rehber bağlantıları bulunur.
- Öğrenci hesaplarının mevcut özellik bayrağı korunur. Bayrak kapalıyken öğrenci kayıt/giriş bağlantıları gösterilmez; anonim oyun keşfi ve kaydetme yolu kullanılabilir.

Tarayıcı doğrulamasında, açıklaması olmayan yayımlanmış test oyunlarının yeni metin vurgulama bileşeninde ana sayfayı hataya düşürdüğü görüldü. Katalog ve detay veri eşlemesi, eksik açıklamayı boş metne çevirerek bu hatayı önler; veri değiştirilmez.

## Doğrulama

- Son kaynaklarla TypeScript tür kontrolü geçti.
- 320, 390, 768, 899, 900, 1024 ve 1440 pikselde taşma ve menü/klavye kontrolleri geçti.
- Öğrenci kaydı, girişten öğrenci kaydına geçiş, eski adres yönlendirmesi, anonim katalog, öğretmen paylaşımı ve mobil menü senaryoları geçti.
- Yerel, ayrı test veritabanında öğretmen, yönetici, öğrenci ve admin için bağlantılar, odak yönetimi ve çıkış doğrulandı. Geçici hesaplar test sonunda temizlendi.
- Öğrenci hesapları kapalıyken aynı genel gezinme senaryosu ayrıca geçti.
- Masaüstü/mobil rehber görsel olarak incelendi. Katalogdan öğrenci bölümüne bağlantı ve bu gezinmede tarayıcı hatası bulunmadığı doğrulandı.
- İlgili Playwright senaryoları `header-navigation.spec.ts`, `hero.spec.ts` ve `atlas.spec.ts` içinde. Yerel ekran görüntüleri ve mekanik tasarım raporu `.data/audience-guide/` altında.

Tasarım taramasındaki 52 px ana başlık önerisi, önceki tanıtımın mevcut başlık ölçeğini koruyan bilinçli bir seçimdir. Bölüm başlıkları belgelenmiş 27 px ölçeğine uyar. Genel CSS dosyasındaki diğer öneriler mevcut tasarım kayıtlarıyla ilgilidir.

Impeccable bağlamı, ürün kayıt biçiminin eski ve tasarım yan kaydının güncel olmadığını bildirdi. Bunların şema onarımı bu düzenlemeye dahil edilmedi; ayrıca `init` ve `document` ile yenilenebilir.
