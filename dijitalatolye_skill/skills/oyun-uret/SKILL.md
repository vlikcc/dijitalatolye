---
name: oyun-uret
description: "Şablondan kopyalayarak yeni bir eğitsel oyun klasörü ve oyunu üretir. /oyun veya /oyun-uret komutlarıyla tetiklenir."
---

# Oyun Üretme Becerisi (oyun-uret)

## Genel Bakış
Bu beceri, eğitsel oyun şablonunu kopyalayarak yepyeni bir oyun geliştirmeyi otomatikleştirir. Kullanıcı bir oyun senaryosu verdiğinde veya `/oyun [oyun-adı] [senaryo]` şeklinde bir talepte bulunduğunda bu beceri devreye girer.

## İş Akışı (Geliştirici Ajan Yönergesi)

### 1. Hazırlık ve Klasör Kopyalama
- Kullanıcının talep ettiği oyun adını Türkçe karakter içermeyen, küçük harflerden oluşan ve kelimeler arasında tire (`-`) olan bir klasör ismine dönüştürün (Örn: `meyve-toplama-oyunu`).
- Çalışma dizinindeki `sablon/` klasörünün tamamını yeni oluşturduğunuz klasör yoluna kopyalayın.
- **Görsel Üretmeme Kuralı:** Oyun üretirken ilk başta veya üretim süresince kesinlikle hiçbir görsel üretmeyin (herhangi bir resim oluşturma/düzenleme aracı kullanmayın).
- **Logoları Koruma Kuralı:** Şablon ile birlikte gelen `gorsel/dark-mod-logo.png` ve `gorsel/light-mod-logo.png` dosyalarını kesinlikle değiştirmeyin, silmeyin veya üzerlerine yazmayın. Logolar varsayılan haliyle korunmalıdır.

### 2. Kodlama Aşaması (index.html Güncellenmesi)
- Yeni oluşturulan klasörün içindeki `index.html` dosyasını düzenleyin.
- Düzenleme yaparken kesinlikle şu kurallara uyun:
  - **Mimarideki Tek Dosya Standardı:** Tüm CSS ve JS kodları `index.html` içerisinde satır içi (inline) olarak yer almalıdır. Harici `.css` veya `.js` dosyaları oluşturmayın.
  - **Renk Paleti ve Tasarım Standartları:** Oyun üretirken kullanıcı eğer spesifik bir renk paleti veya tasarımı belirtirse onu kullanın. Eğer belirtmezse, rastgele renk geçişleri kullanmayın; Figma renk kombinasyonları (Color Combinations - https://www.figma.com/resource-library/color-combinations/) ve Gradients.app (https://gradients.app/tr/colorpalette) standartlarına uygun, modern UI/UX trendlerini yansıtan paletler tercih edin.
    * **Renk Uyumu:** Renk seçimlerinde her zaman kontrastı yüksek, birbirini tamamlayan (complementary) veya ardışık (analogous) profesyonel renk paletlerini kullanın.
    * **Gradyan Mantığı:** Gradyan (gradient) kullanırken keskin ve kirli geçişlerden kaçının; yumuşak, opaklığı dengelenmiş ve modern arayüz trendlerine uygun (örneğin soft pasteller veya derin kurumsal neonlar) gradyanlar oluşturun.
    * **Erişilebilirlik (WCAG):** Eğitim materyali üretildiği için, arka plan ile metin/buton renkleri arasındaki kontrast oranının okunabilirliği engellemeyecek şekilde (en az WCAG AA standartlarında) olmasını sağlayın.
    * **Renk Rolleri:** Her oyun için belirleyeceğiniz palette şu rolleri kesin olarak tanımlayın: Primary (Ana Eylem), Secondary (İkincil Eylem), Success (Doğru Cevap), Error (Yanlış Cevap) ve Background (Arka Plan).
  - **Etkileşim Fallback:** Sürükle-bırak mekaniği varsa, akıllı tahta ve dokunmatik ekranlar için tıklayarak taşıma desteğini de kodlayın (Önce öğeye tıklayıp sonra hedefe tıklayarak taşıma).
  - **Pedagojik Akış:** Doğru cevaplarda yeşil renk, onay sesi ve açıklayıcı metin; yanlış cevaplarda kırmızı renk, hata sesi ve düzeltici yapıcı metin ("Doğrusu ... olmalıydı çünkü ...") sunun.
  - **Gezinme ve Kontrol Düğmeleri:** Sol üstteki "Ana Sayfa" (`#btn-home`) ve "Geri Dön" (`#btn-back`) butonlarının işlevsel olmasını sağlayın. Sağ üstteki kontrol barında **ayrı** butonlar bulunur: Tema (açık/koyu, `#btn-theme-toggle` — tema değişiminde `dark-mod-logo.png`/`light-mod-logo.png` arası geçiş), Ses efekti (`#btn-audio-toggle`), Arka plan müziği (`#btn-music-toggle`) ve en sağda Tam Ekran (`#btn-fullscreen-toggle`). Bu dört butonu ve bağlı mantığı (Fullscreen API dâhil) koruyun; ses ve müzik düğmelerini tek butona birleştirmeyin.
  - **Giriş Ekranı Bileşenleri:** Giriş ekranındaki cihaz uyumluluk rozetlerini (`.home-badges-container` — yalnızca ikon, metin yok) koruyun. Oyun sadece yatay oynanıyorsa yatay mod uyarısını (`#landscape-warning`) etkin tutun.
  - **Klavye/ARIA Erişilebilirliği:** Şablondaki etkileşimli ögelerde `tabindex`, `role` ve `aria-label`, modallarda `role="alertdialog"`/`aria-modal`/`aria-live` altyapısı hazır gelir. Bunu koruyun ve eklediğiniz yeni etkileşimli ögelere de uygulayın.
  - **Yasaklı API'ler (Moderasyon):** Yüklenen oyunlar otomatik moderasyon statik analizinden geçer ve en az bir kritik bulgu **otomatik reddedilir**. `eval()`, `Function()`, `document.write`, `document.cookie`, `window.opener`, `navigator.geolocation` ve dış `<script src="http...">` **kesinlikle kullanılmamalıdır**. `localStorage`, `indexedDB`, `navigator.sendBeacon`, `fetch()`, `XMLHttpRequest`, `<iframe>` uyarı üretir; bunlardan kaçının. Oyun durumunu bellek içi `OYUN_DURUMU` nesnesinde tutun; `localStorage`'ı yalnızca tema tercihi için kullanın.
  - **Harici CDN Yasaktır:** Hiçbir görsel, ses veya yazı tipini harici bir web adresinden (CDN/URL) çekmeyin. Göreli (relative) yerel yollar kullanın. Şablonda Outfit fontu `font/` klasöründen yerel `@font-face` ile yüklenir; bu yapıyı koruyun, Google Fonts gibi CDN bağlantıları **eklemeyin**.
  - **Türkçe Karakter Uyum Kuralları:**
    * HTML dosyasının en tepesinde `<html lang="tr">` özniteliğinin tanımlanması zorunludur (CSS `text-transform: uppercase` gibi dönüştürmelerin Türkçe karakterleri bozmasını önlemek için).
    * JavaScript kodunda veya dinamik metinlerde harf dönüşümleri yaparken kesinlikle `.toLocaleUpperCase('tr-TR')` ve `.toLocaleLowerCase('tr-TR')` metotlarını kullanın. Düz `.toUpperCase()` ve `.toLowerCase()` metotlarını asla kullanmayın.
  - **Pedagojik Konsept Kuralları:** Aksi belirtilmediği sürece eğitsel oyun tasarımlarında büyücü, sihir, iksir, fantastik macera gibi fantastik veya sürreal konseptler kesinlikle kullanılmamalıdır. Bunun yerine, günlük yaşama ve öğretim kazanımlarına uygun bilimsel, matematiksel, doğal veya sportif konseptler kurgulanmalıdır.
  - **Oyuna Özel Mantığın Uyarlanması:** Şablondaki örnek "meyve eşleştirme" mekaniği, skoru (`+= 50`) ve yıldız eşikleri (`endGame` içindeki `skor === 100` gibi sabitler) demoya özeldir. Yeni oyunun mantığına göre bu skor/yıldız eşiklerini mutlaka yeniden hesaplayın; örnek sabitleri olduğu gibi bırakmayın.

### 3. İçerik İzleme SDK Entegrasyonu (ZORUNLU)
Platform, oyunları izole bir iframe içinde çalıştırır ve öğrencinin ne öğrendiğini (ilerleme, tamamlama, skor) `postMessage` tabanlı SDK ile toplar. Şablonun `<script>` bloğunda gömülü `DijitalAtolye` SDK'sı ve `KAZANIM_KODU` sabiti hazır gelir. Üretilen her oyunda şunları yapın:
- **Kazanım kodunu ayarlayın:** Şablondaki `const KAZANIM_KODU = 'GENEL.0.0';` satırını oyunun hedeflediği MEB kazanım koduyla güncelleyin (örn. `'M.5.1.1'`, en fazla 32 karakter). Kullanıcı kod belirtmemişse ondan bu kodu isteyin; vermezse `'GENEL.0.0'` bırakın.
- **İlerleme bildirin:** Öğrenci anlamlı bir adım tamamladığında (doğru cevap, bölüm geçişi vb.) `DijitalAtolye.progress({ outcomeCode: KAZANIM_KODU, score: OYUN_DURUMU.skor })` çağırın.
- **Tamamlamayı bildirin:** Oyun bittiğinde `endGame` içinde `DijitalAtolye.complete({ outcomeCode: KAZANIM_KODU, score: <0-100 arası skor>, durationSeconds: <geçen süre> })` çağrısının korunduğundan emin olun. Skoru daima 0–100 aralığına ölçeklendirin.
- **Gömülü SDK'yı silmeyin:** Şablonun başındaki `DijitalAtolye` IIFE bloğunu kaldırmayın. Tamamen offline çalışır; iframe dışında sessizce devre dışı kalır.

### 4. Varlık (Asset) Listesi Çıkarma
- Oyunun çalışması için gereken ses, görsel veya videoları kod içinde yerel yollarla tanımladıktan sonra kullanıcıya eksiksiz bir ihtiyaç listesi sunun (Örn: *"Oyun kodlandı. Lütfen şu görselleri gorsel/ klasörüne ekleyin"*).

### 5. Temel Doğrulama ve Tarayıcıda Test Etmeme Kuralı
- **Tarayıcı otomasyonu yok:** Oyunu Playwright/Selenium vb. ile açıp test etmeyin.
- **Ancak kod statik olarak doğrulanmalı:** Kullanıcı kodlama bilmediği için teslimden önce kodu kendiniz gözden geçirin ve en azından şunları doğrulayın:
  - HTML kapanış etiketleri ve `<script>`/`<style>` blokları eksiksiz mi?
  - JavaScript'te tanımsız değişken/fonksiyon çağrısı, eşleşmeyen parantez/süslü parantez var mı?
  - Kod içindeki tüm `gorsel/`, `ses/`, `video/` yolları varlık listesinde kullanıcıya bildirildi mi?
  - `<html lang="tr">`, `<meta charset="UTF-8">`, gömülü `DijitalAtolye` SDK bloğu ve yerel `@font-face` korunuyor mu?
  - Kodda Türkçe karakterli (ğ, ş, İ, ı, ç, ö, ü) değişken/fonksiyon/ID adı **bulunmamalı**.
  - **Moderasyon kontrolü (kritik):** Kodda `eval(`, `Function(`, `document.write`, `document.cookie`, `window.opener`, `navigator.geolocation` veya dış `<script src="http...">` **bulunmadığını** doğrulayın (bunlar otomatik redde yol açar). `localStorage` yalnızca tema tercihi için kullanılmalı; oyun durumu bellek içi `OYUN_DURUMU`'nda olmalı. Gereksiz `fetch`/`XMLHttpRequest`/`<iframe>` bulunmamalı.
- Doğrulama tamamlandığında sonucu ve varsa kullanıcıdan beklenen medya listesini net şekilde raporlayın.
