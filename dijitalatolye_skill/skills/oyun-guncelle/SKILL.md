---
name: oyun-guncelle
description: "Daha önceden geliştirilmiş olan eski bir oyunu standart şablona göre günceller ve dosyalar. /oyunguncelle komutuyla tetiklenir."
---

# Oyun Güncelleme Becerisi (oyun-guncelle)

## Genel Bakış
Bu beceri, `oyunguncelle/` klasörünün altına atılan eski bir oyun projesini teknik ve pedagojik standartlarımıza (`sablon/index.html` ve projenin mimari kılavuzları) uygun hale getirmek için analiz eder, kullanıcı onayını alır ve orijinal dosyalara dokunmadan yeni bir güncel oyun sürümü üretir.

## Kullanım Yönergesi (Ajan İçin)
Kullanıcı `/oyunguncelle [eski-oyun-klasor-adi]` komutunu veya benzer doğal dil talebini tetiklediğinde sırasıyla şu adımları izleyin:

### 1. Analiz Aşaması
- `oyunguncelle/[eski-oyun-klasor-adi]` yolundaki oyun klasörünün içeriğini tarayın.
- **HTML Analizi:** HTML dosyasındaki başlığı, CSS renk şemasını, JS mekaniklerini ve varsa harici kütüphane bağlantılarını (CDN/URL) tespit edin.
- **Varlık (Asset) Analizi:** Oyunda kullanılan görselleri, sesleri, videoları ve GIF'leri listeleyin.
- **Standart Karşılaştırması:** Oyunun şablon standartlarına (`sablon/index.html`, `MIMARI.md`, `KODLAMA_STANDARTLARI.md`) göre eksiklerini ve uyumsuzluklarını belirleyin:
  - Letterbox (oran korumalı ekran ölçekleme) var mı?
  - CSS ve JS tek dosya standardında mı?
  - Navigasyon, tema ve ses kontrol butonları mevcut mu?
  - Dosya isimlendirmeleri snake_case mi?
  - İçerik İzleme SDK'sı (`DijitalAtolye` / `postMessage`) entegre mi? (Eski oyunlarda büyük olasılıkla yoktur; eklenmesi gerekecektir.)
  - Yazı tipi yerel `@font-face` ile mi yükleniyor, yoksa Google Fonts gibi bir CDN'den mi çekiliyor?
  - **Yasaklı API taraması (Moderasyon):** Eski kodda `eval(`, `Function(`, `document.write`, `document.cookie`, `window.opener`, `navigator.geolocation` veya dış `<script src="http...">` var mı? (Bunlar moderasyonda otomatik redde yol açar; mutlaka temizlenmelidir.) Ayrıca `localStorage`, `indexedDB`, `navigator.sendBeacon`, `fetch`, `XMLHttpRequest`, `<iframe>` kullanımını tespit edin (uyarı üretirler).

### 2. Raporlama ve Kullanıcı Onayı Aşaması
- Analiz bittiğinde, yapılacak değişiklikleri kullanıcıya rapor edin ve **kesin onay isteyin**.
- Rapor içeriğinde şunlar yer almalıdır:
  - **Kod Değişiklikleri:** Şablona entegre edilecek mekanikler (örn: *"Giriş ekranına ses/tema butonları eklenecek, CSS letterbox container'ına taşınacak"*).
  - **Varlık Taşımaları:** Hangi varlıkların nereye kopyalanacağı ve isimlerinin nasıl düzenleneceği (örn: *"Eski oyundaki logo.png dosyası artık kullanılmayacak, bunun yerine şablondaki dark-mod-logo.png ve light-mod-logo.png dosyaları gorsel/ altına kopyalanarak dinamik tema logoları kullanılacaktır, diger_resim.PNG -> diger_resim.png olarak adlandırılıp gorsel/ altına taşınacak"*).
  - **Güvenlik Güvencesi:** Orijinal oyun dosyalarında hiçbir değişiklik yapılmayacağı ve yeni bir klasör oluşturulacağı açıkça belirtilmelidir.
- **Kullanıcı onay verene kadar hiçbir dosyayı yazmayın veya değiştirmeyin.**

### 3. Uygulama Aşaması (Onay Sonrası)
- Kullanıcı onay verdiğinde, `oyunguncelle/` klasörünün yer aldığı üst dizinde `[eski-oyun-klasor-adi]-guncellenmis/` adında yeni bir klasör oluşturun.
- **Varlıkları Taşıma:** 
  - Eski oyundaki görselleri, sesleri ve videoları standartlara uygun şekilde yeni klasörün altındaki `gorsel/`, `ses/` ve `video/` klasörlerine kopyalayın. İsimlerde Türkçe karakterleri temizleyin ve küçük harf/snake_case standardına uyarlayın.
  - Eski `logo.png` görselini taşımayın/kullanmayın. Bunun yerine, `sablon/gorsel/` klasörü altındaki `dark-mod-logo.png` ve `light-mod-logo.png` dosyalarını yeni oluşturulan oyun klasöründeki `gorsel/` dizinine kopyalayın.
- **HTML Entegrasyonu:** `sablon/index.html` yapısını temel alarak eski oyunun tüm CSS, JS ve HTML kodlarını bu şablona entegre edin:
  - Eski CSS kodlarını inline olarak `<style>` alanına taşıyın, çakışmaları önleyin.
  - Oyun mekaniklerini (JS) ve durum yönetimini (State Machine) entegre edin.
  - Letterbox ölçekleme fonksiyonunu ve ekran akışlarını koruyun.
  - Harici CDN bağlantısı varsa bunları yerel yollarla değiştirin.
  - **Tam Ekran Desteği Entegrasyonu:** Sağ üst köşedeki kontrol barının en sağına tam ekran butonu yerleştirilmesini (`btn-fullscreen-toggle`) ve Fullscreen API logic'inin entegre edilmesini sağlayın.
  - **İçerik İzleme SDK Entegrasyonu (ZORUNLU):** `sablon/index.html` içindeki gömülü `DijitalAtolye` SDK bloğunu ve `KAZANIM_KODU` sabitini yeni sürüme taşıyın. Eski oyunun skor/tamamlanma mantığına bağlayın: doğru adımlarda `DijitalAtolye.progress(...)`, oyun bitiminde `DijitalAtolye.complete({ outcomeCode: KAZANIM_KODU, score: <0-100>, durationSeconds: <süre> })` çağırın. Kullanıcıdan oyunun MEB kazanım kodunu isteyin; vermezse `'GENEL.0.0'` bırakın.
  - **Yerel Yazı Tipi:** Yazı tipini şablondaki yerel `@font-face` (`font/` klasörü) yapısıyla yükleyin. Eski oyunda Google Fonts gibi bir CDN bağlantısı varsa kaldırın ve yerel fonta dönüştürün.
  - **Yasaklı API'leri Temizleme (Moderasyon - ZORUNLU):** Güncellenen oyun, platformun otomatik moderasyon statik analizinden geçer; en az bir kritik bulgu **otomatik reddedilir**. Eski koddaki `eval()`, `Function()`, `document.write`, `document.cookie`, `window.opener`, `navigator.geolocation` ve dış `<script src="http...">` çağrılarını tamamen kaldırın/eşdeğer güvenli yöntemlerle değiştirin. `localStorage`/`indexedDB` ile saklanan oyun durumunu bellek içi `OYUN_DURUMU` nesnesine taşıyın (`localStorage` yalnızca tema tercihi için kalabilir). Gereksiz `fetch`/`XMLHttpRequest`/`<iframe>` varsa kaldırın.
  - **Giriş Ekranı ve Kontroller:** Şablonun ayrı ses (`#btn-audio-toggle`) ve müzik (`#btn-music-toggle`) butonlarını, tema butonunu (`dark-mod-logo.png`/`light-mod-logo.png` geçişiyle), cihaz uyumluluk rozetlerini (`.home-badges-container`) ve gerekiyorsa yatay mod uyarısını (`#landscape-warning`) entegre edin/koruyun.
  - **Klavye/ARIA Erişilebilirliği:** Etkileşimli ögelere `tabindex`, `role`, `aria-label`; modallara `role="alertdialog"`, `aria-modal`, `aria-live` ekleyin (şablondaki yapıyı koruyarak).
  - **Türkçe Karakter Uyum Kuralları:**
    * HTML dosyasının en tepesinde `<html lang="tr">` özniteliğinin tanımlanması zorunludur (CSS `text-transform: uppercase` gibi dönüştürmelerin Türkçe karakterleri bozmasını önlemek için).
    * JavaScript kodunda veya dinamik metinlerde harf dönüşümleri yaparken kesinlikle `.toLocaleUpperCase('tr-TR')` ve `.toLocaleLowerCase('tr-TR')` metotlarını kullanın. Düz `.toUpperCase()` ve `.toLowerCase()` metotlarını asla kullanmayın.
  - **Pedagojik Konsept Kuralları:** Aksi belirtilmediği sürece güncellenen oyunlarda büyücü, sihir, iksir, fantastik macera gibi fantastik veya sürreal konseptler kesinlikle kullanılmamalıdır. Eğer eski oyunda bu konseptler varsa, güncelleme esnasında bunların günlük yaşama ve öğretime uygun gerçekçi konseptlerle (bilim, doğa, spor vb.) değiştirilmesini sağlayın.
- Yeni oluşturulan `[eski-oyun-klasor-adi]-guncellenmis/` klasörünün altındaki dosyaları kaydedin.
- İşlem tamamlandığında kullanıcıya başarı mesajını ve yeni klasör yolunu iletin.

### 4. Tarayıcıda Test Etmeme Kuralı
- Oyun başarıyla güncellendikten sonra oyunu tarayıcı otomasyonu (Playwright, Selenium vb.) ile açıp test etmeyin. Güncelleme adımları tamamlandığında doğrudan sonucu kullanıcıya rapor edin.
