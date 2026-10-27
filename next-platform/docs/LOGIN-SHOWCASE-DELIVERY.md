# Giriş ekranı — görsel iyileştirme

27 Ekim 2026. Yerel önizleme: `http://localhost:3000/giris`.

Kullanıcının daha premium ve görsel olarak güçlü giriş ekranı talebi üzerine, form beyaz bir yüzeyde; gerçek oyun kapakları lacivert bir vitrinde birleştirildi. Nötr zemin, Manrope / Source Sans 3, mevcut lacivert ve amber tokenları kullanıldı. Yeni paket veya görsel eklenmedi.

- Masaüstünde en fazla üç gerçek katalog kapağı katmanlı gösterilir. Kullanıcı küçük kapak düğmeleriyle öndeki oyunu seçer; otomatik dönüş yoktur.
- Başlık, ders, sınıf ve Demo/Yayımlandı bilgisi seçilen gerçek kayıttan gelir. Boş katalog veya yüklenemeyen kapak için oyun uydurulmaz. İlk hydration öncesinde başarısız olan görseller de ayıklanır.
- 1024 px altında vitrin gizlenir. Form alanları ve birincil düğme en az 52 px; alt bağlantılar en az 44 px yüksekliktedir.
- Kapak düğmeleri klavyeyle çalışır, seçimi `aria-pressed` ile bildirir; görünür beyaz odak çizgisi kullanır. Kapak geçişleri kısa ve elle tetiklenir; azaltılmış hareket tercihinde kapanır.
- `AuthForm`, parola bileşeni ve kimlik doğrulama mantığı değiştirilmedi. Kayıt ekranı mevcut görünümünü kullanır; yeni görünüm yalnız `/giris` için açılır.

## 21st kaynağı

MCP `get_usage`: ücretli erişim doğrulandı; AI üretimi kapalı. `search` ve `get_component` kullanıldı. [Split Sign In Form — diarmuradi](https://21st.dev/@diarmuradi/components/sign-in-3), demo ID `39096`, component ID `22060`, 27 Ekim 2026 tarihinde incelendi. Kaynak özeti: iki sütun, kompakt form, ayrı görsel panel ve belirgin alan/eylem hiyerarşisi.

MCP yanıtı kaynak commit'i veya doğrulanmış lisans içermediğinden örnek kod projeye kopyalanmadı. Yalnız kompozisyon fikrinden yararlanıldı. Kendi `AccountLayout`, `AuthForm`, `Button`, `catalogArtwork` ve mevcut CSS tokenları kullanılarak bağımsız uygulandı. Sosyal giriş, örnek müşteri yorumu, dış görseller ve ek bağımlılıklar alınmadı. AI çağrısı veya ek satın alma yapılmadı.

## Doğrulama

- TypeScript başarılı; 15 dosyada 128 birim testi geçti.
- Ayrı `.next-login-premium-check` dizininde Next.js üretim derlemesi başarılı.
- Dört ilgili Playwright senaryosu geçti: mevcut hesap/kayıt akışı, kapak hatası ve alternatif kapak, klavye/form taslağı korunması, hata/çift gönderim/iki aşamalı doğrulama görünümü.
- Metin kontrastları: beyaz/lacivert 12,55:1; amber/lacivert 5,91:1; ikincil metin/beyaz 5,48:1. Giriş alanlarının kenarlığı nötr dolgu üzerinde `--muted` kullanır.
- Giriş ve kayıt 320, 390, 600, 768, 1024, 1440 px boyutlarında kontrol edildi. Yatay taşma yok. Uzun Türkçe metin, %200 CSS yakınlaştırma, odak ve azaltılmış hareket kontrol edildi.
- Hata ve iki aşamalı doğrulama arayüzü tarayıcıda kontrollü HTTP yanıtlarıyla denendi; gerçek hesap, e-posta veya üretim verisi değiştirilmedi. Sunucu kimlik doğrulaması bu görsel değişiklik kapsamında yeniden uçtan uca test edilmedi.
- 21st CLI yerel denetimi dört uygulama dosyasında çalıştırıldı. 58 bilgi düzeyindeki bulgu mevcut global CSS renklerine aittir; yeni giriş bloğunda veya bileşenlerde bulgu yok. Otomatik düzeltme uygulanmadı.

Görüntüler: `.impeccable/review/login-premium/before/` ve `after/`. Sonraki klasör masaüstü/mobil, seçili kapak ve klavye odağı, hata, gönderim, yedek kod, uzun metin, yakınlaştırma ve kapaksız durumları içerir. Bu tur Chrome üzerinde doğrulandı; önceki pilotun Safari kaydı bu yeni tasarım için yeniden test kanıtı sayılmaz.

Canlı dağıtım yapılmadı. Yerel geliştirme sunucusu port 3000 üzerinde çalışır.

## Hesap oluşturma ekranına devam — 27 Ekim 2026

Kullanıcı kayıt ekranının da aynı görünüme geçmesini istedi. `/kayit` artık ortak vitrini kullanır. `account-layout-register` yalnız kayıt sayfasında başlığı, sekme aralıklarını, uzun form boşluklarını ve alt giriş bağlantısını düzenler. Öğretmen/öğrenci alanları, özelliğin açılıp kapanması, kaydetme/validasyon ve sekmelerdeki taslaklar değişmedi. Bu istek önceki bölümdeki “kayıt mevcut görünümünü kullanır” kararını günceller.

TypeScript ve mevcut hesap Playwright testi geçti. Test giriş, öğretmen kayıt ve öğrenci kayıt görünümünü 320/390/600/768/1024/1440 px boyutlarında; parola sınırları, sınıf kodu açıklaması ve sekmelerde alan değerlerinin korunmasıyla doğruladı. 21st yerel denetimi çalıştırıldı. Tam sayfa kayıt görüntüleri `.impeccable/review/register-showcase/` altında tutulur. Bu küçük sunum genişletmesi için yeni paket, API değişikliği veya tekrar tüm test paketi eklenmedi.
