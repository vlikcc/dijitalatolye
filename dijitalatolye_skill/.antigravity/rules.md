# Antigravity Proje Kuralları (rules.md)

Bu kurallar, bu dizinde geliştirilecek olan tüm e-içerik, simülasyon ve eğitsel oyun projeleri için geçerlidir. Ajanların (AI) kod yazarken veya yeni dosyalar oluştururken bu kurallara kesinlikle uyması gerekir.

---

## 1. Genel Teknoloji ve Dosya Yapısı

*   **Tek Dosya Standardı:** Tüm oyun, içerik veya simülasyonlar tek bir HTML dosyası (`index.html`) halinde kodlanmalıdır. CSS ve JavaScript kodları harici dosya olarak değil, bu HTML dosyasının içinde `<style>` ve `<script>` etiketleri ile inline (satır içi) yazılmalıdır.
*   **Harici Bağlantı (CDN/URL) Kısıtı:** Görsel, ses ve video gibi medya dosyaları harici web adreslerinden (CDN/URL) çekilemez. Tamamen yerel (offline) dizinlerden göreceli yol ile çağrılmalıdır.
*   **Dizin Düzeni:** Her içerik için yeni bir klasör oluşturulmalı ve medya varlıkları bu klasör içindeki ilgili dizinlerde tutulmalıdır:
    ```text
    [oyun-klasor-adi]/
    ├── index.html
    ├── gorsel/
    ├── ses/
    ├── video/
    └── font/      (Yerel yazı tipi dosyaları: .woff2)
    ```
*   **Karakter Kodlaması (Encoding):** Türkçe karakterlerin tüm işletim sistemleri ve tarayıcılarda sorunsuz görüntülenebilmesi için dosya kodlaması kesinlikle **UTF-8** olmalı ve HTML içinde `<meta charset="UTF-8">` etiketi yer almalıdır.
*   **Dosya ve Kod İsimlendirmeleri:**
    *   Medya dosya isimlerinde Türkçe karakter (ğ, ı, ş, ç, ö, ü) ve boşluk bulunmamalı, kelimeler alt çizgi (`_`) veya tire (`-`) ile ayrılmalıdır (örn: `dogru_ses.mp3`).
    *   Kod içerisindeki değişken, fonksiyon ve sınıf isimlerinde Türkçe karakter kullanılmamalıdır (örn: `dogru_cevap_sayisi`, `skor_hesapla`).
    *   Kod içi açıklamalar (yorum satırları) tamamen anlaşılır Türkçe ile yazılmalıdır.
*   **Esnek Medya Akışı (Görsel/Ses İsteme Özgürlüğü):** Yapay zeka, kodlamayı yaparken veya tamamladıktan sonra ihtiyaç duyduğu ses, görsel veya videoları kullanıcıdan talep edebilir. Kod içinde yerel yollar (örn: `gorsel/kirmizi_elma.png`) tanımlanıp kod tamamlandıktan sonra kullanıcıya *"Oyunu kodladım. Lütfen şu dosyaları şu isimlerle gorsel/ klasörüne ekleyin"* şeklinde net bir talep listesi sunulabilir.
*   **Yasaklı API'ler (Moderasyon):** Yüklenen oyunlar yayına alınmadan önce otomatik moderasyon hattının statik analizinden geçer ve en az bir kritik bulgu **otomatik redde** yol açar. Oyunlarda kesinlikle `eval()`, `Function()`, `document.write`, `document.cookie`, `window.opener`, `navigator.geolocation` veya dış `<script src="http...">` kullanılmamalıdır. `localStorage`, `indexedDB`, `navigator.sendBeacon`, `fetch()`, `XMLHttpRequest` ve `<iframe>` uyarı üretir ve içeriği editör incelemesine düşürür; bunlardan kaçının. Oyun durumu `localStorage` yerine bellek içi global nesnede (`OYUN_DURUMU`) tutulmalı; `localStorage` yalnızca tema tercihi için sınırlı kullanılmalıdır. Platforma tek meşru iletişim, gömülü `DijitalAtolye` SDK'sının `postMessage` köprüsüdür.

---

## 2. Tasarım ve Arayüz Standartları

*   **Premium Tasarım:** Arayüzler modern, canlı ve estetik olmalıdır. Düz, standart web renkleri yerine modern renk paletleri (gradients.app, Figma renk kombinasyonları) ve gradyanlar kullanılmalıdır.
    *   *Renk Skalası ve Çeşitlilik:* Geliştirilen tüm oyunlarda aynı renk paleti (örneğin varsayılan şablondaki indigo/mor/slate tonları) kullanılmamalıdır. Her oyunun konusuna, pedagojik amacına veya seçilen temaya uygun, farklı ve uyumlu bir renk skalası belirlenmelidir (örn: orman/çevre konusu için yeşil ve kahverengi tonları; deniz/su teması için turkuaz ve açık mavi tonları; uzay konsepti için koyu lacivert/mor tonları).
*   **Ekran Uyumluluğu (Letterbox):** 
    *   Oyunlar, farklı ekranlarda (akıllı tahta, tablet, mobil) kayma yapmaması için 16:9 sabit oranlı bir ana konteyner içinde ölçeklenmelidir.
    *   Sadece akıllı tahta uyumlu olan içeriklerin giriş sayfasında akıllı tahta logosu/uyarısı yer almalıdır.
    *   Eğer oyun sadece yatay (landscape) ekranda oynanabiliyorsa, dikey tutulan cihazlarda "Cihazınızı yatay çevirin" animasyonlu uyarısı gösterilmelidir.
*   **Kaydırma Çubukları (Scrollbars):** Oyun alanında dikey veya yatay kaydırma çubuğu (scrollbar) görünmemelidir (`overflow: hidden`).
*   **Tipografi:** Modern yazı tipleri (Inter, Outfit veya Roboto gibi) kullanılmalıdır. Ancak CDN yasağı gereği fontlar **harici Google Fonts bağlantısıyla değil**, font dosyaları (`.woff2`) oyun klasörüne (`font/`) konularak yerel `@font-face` ile yüklenmelidir. Şablonda Outfit fontu bu şekilde hazır gelir.
*   **Pop-out Modallar:** Tarayıcının standart gri `alert()` veya `confirm()` pencereleri kesinlikle kullanılmayacaktır. Tüm uyarı ve yönlendirmeler oyun içi CSS ile tasarlanmış modern "Pop-out" modal pencereleri olarak yapılmalıdır.

---

## 3. Pedagojik ve Etkileşim Kuralları (MEB Uyum)

*   **Giriş Ekranı:** Her içerikte oyun başlamadan önce bir Giriş Ekranı bulunmalıdır. Bu ekranda:
    *   Oyunun adı ve pedagojik amacı
    *   "Nasıl Oynanır?" yönergesi ve kurallar
    *   Ses efekti ve arka plan müziği için **ayrı** açma/kapama butonları (`#btn-audio-toggle` ve `#btn-music-toggle`) ile tema (açık/koyu) ve tam ekran butonları
    *   Cihaz uyumluluk rozetleri (yalnızca ikon, metin açıklaması olmadan)
    *   Oyunu Başlat butonu yer almalıdır.
*   **Kademeli Zorluk (Scaffolding):** Seviyeler aşamalı olarak zorlaşmalıdır. İlk adımda oyuncuya aşırı bilişsel yük bindirilmemeli ve başarısızlık korkusu yaratılmamalıdır.
*   **Etkileşim Fallback (Sürükle-Bırak & Tıkla-Taşı):**
    *   Sürükle-bırak mekaniği içeren oyunlarda, dokunmatik ekranlar ve akıllı tahta hassasiyetleri için **tıklayarak taşıma** desteği de olmalıdır. (Önce taşınacak nesneye tıklanır, ardından hedef kutuya tıklanarak taşıma gerçekleştirilir).
*   **Klavye ve Ekran Okuyucu Erişilebilirliği:** Etkileşimli ögeler (taşınabilir nesneler, bırakma hedefleri, butonlar) `tabindex`, `role` ve açıklayıcı `aria-label` ile klavyeden erişilebilir olmalıdır. Geri bildirim/uyarı modalları `role="alertdialog"`, `aria-modal="true"` ve `aria-live` ile işaretlenmelidir. Şablonda hazır gelen bu altyapı korunmalı, yeni eklenen ögelere de uygulanmalıdır.
*   **Doğru/Yanlış Geri Bildirimleri:**
    *   **Doğru:** Yeşil renk tonları + "✓" onay sembolü + Olumlu yönlendirici metin + Başarı ses efekti.
    *   **Yanlış:** Kırmızı renk tonları + "✗" hata sembolü + Yapıcı geri bildirim metni ("Doğrusu ... çünkü ...") + Hata ses efekti.
*   **Sonuç Ekranı:** Oyun sonunda:
    *   Kazanılan skor
    *   Elde edilen yıldız sayısı (1, 2 veya 3 yıldız animasyonu)
    *   "Tekrar Oyna" butonu gösterilmelidir.
