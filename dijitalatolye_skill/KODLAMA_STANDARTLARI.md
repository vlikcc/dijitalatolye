# Kodlama Standartları Kılavuzu (KODLAMA_STANDARTLARI.md)

Bu kılavuz, kodlama bilmeyen ekiplerin yapay zeka (AI) aracılığıyla ürettiği veya düzenlediği kodların okunabilir, sürdürülebilir ve hatasız olmasını sağlamak amacıyla oluşturulmuştur.

---

## 1. Karakter Kodlaması ve Dil Kuralları

### UTF-8 ve Dil Tanımlama Zorunluluğu:
*   Tüm dosyalar **UTF-8** karakter kodlamasıyla kaydedilmelidir. Windows-1254 veya ISO-8859-9 gibi eski kodlamalar tarayıcılarda Türkçe karakter hatalarına sebep olur.
*   HTML dosyasının en tepesinde `<meta charset="UTF-8">` tanımlaması bulunmalıdır.
*   HTML dosyasının en üstünde `<html lang="tr">` tanımlaması yapılması zorunludur. Aksi takdirde, CSS üzerindeki `text-transform: uppercase;` gibi kurallar tarayıcının varsayılan dil ayarlarına göre Türkçe karakterleri (örn. "i" -> "I" şeklinde) hatalı dönüştürür.

### Kod İçinde Dil Kullanımı:
*   **Kullanıcı Arayüzü (Görünen Metinler):** Oyuncunun ekranda gördüğü tüm yazılar, düğme isimleri, kurallar ve geri bildirim metinleri imla kurallarına uygun, doğru Türkçe karakterlerle yazılmalıdır (örn: *"Doğru cevap! Harikasın!"*).
*   **JavaScript Büyük/Küçük Harf Dönüşümleri:** Kod içerisinde veya dinamik metinlerde büyük/küçük harf dönüşümü yapılırken Türkçe karakterlerin kaybolmaması için kesinlikle `.toLocaleUpperCase('tr-TR')` ve `.toLocaleLowerCase('tr-TR')` metotları kullanılmalıdır. Kesinlikle düz `.toUpperCase()` veya `.toLowerCase()` kullanılmamalıdır.
    *   *Örnek:* `const dogru_metin = "misafir".toLocaleUpperCase('tr-TR'); // "MİSAFİR"`
*   **Kod Bileşenleri (Değişkenler ve Fonksiyonlar):** Javascript kodundaki değişken, fonksiyon, sınıf ve kimlik (ID) isimlerinde Türkçe karakter kullanılmamalıdır.
    *   *Doğru:* `const dogru_cevap = 5;`, `function skoru_guncelle() {}`
    *   *Yanlış:* `const doğru_cevap = 5;`, `function skoruGüncelle() {}`
*   **Yorum Satırları:** Kodun ne işe yaradığını açıklayan yorum satırları, kodlama bilmeyen kişilerin de anlayabileceği şekilde **tamamen Türkçe** ve açık yazılmalıdır.

### Eğitsel İçerik ve Konsept Sınırları:
*   **Fantastik Konsept Kısıtlaması:** Aksi belirtilmediği sürece eğitsel oyun senaryolarında, arayüzlerinde veya kullanılan ögelerde büyücü, sihir, iksir, fantastik macera gibi sürreal/gerçek dışı konseptler KESİNLİKLE kullanılmamalıdır.
*   **Gerçekçi ve Eğitsel Yaklaşım:** Oyunlarda günlük hayatla ilişkili, bilimsel, matematiksel, doğal veya sportif konseptler (örn. meyve toplama, sayılarla eşleştirme, doğa olayları, spor aktiviteleri vb.) temel alınmalı, çocukların gelişimine uygun pedagojik sınırlar korunmalıdır.

---

## 2. İsimlendirme Standartları

*   **Klasör ve HTML Dosya İsimleri:** Kebab-case (küçük harfler ve kelimeler arası tire) kullanılmalıdır. Türkçe karakter içermemelidir.
    *   *Örnek:* `renk-eslestirme-oyunu/`, `index.html`
*   **Medya Dosya İsimleri:** Snake_case (küçük harfler ve kelimeler arası alt çizgi) kullanılmalıdır. Türkçe karakter içermemelidir.
    *   *Örnek:* `gorsel/kirmizi_elma.png`, `ses/basari_sesi.mp3`
*   **CSS Sınıf ve ID İsimleri:** Kebab-case kullanılmalıdır.
    *   *Örnek:* `<div id="oyun-alani">`, `<button class="btn-tekrar-oyna">`
*   **JavaScript Değişkenleri:** CamelCase veya Snake_case kullanılabilir. Ancak dosya genelinde tutarlı olunmalıdır.
    *   *Örnek:* `const aktifSeviye = 1;` veya `const aktif_seviye = 1;`

---

## 3. Temiz Kod ve AI Yönlendirme Kuralları

Ekip AI ile kod yazarken aşağıdaki temiz kod kurallarına uymasını talep etmelidir:

### Modüler ve Kısa Fonksiyonlar
Her fonksiyon sadece tek bir iş yapmalıdır. Örneğin, skoru güncelleyen fonksiyon aynı zamanda ekrandaki yıldız animasyonunu tetiklememelidir. Bu iki işlem ayrı fonksiyonlarda yazılıp sırayla çağrılmalıdır.

### Renk Değişkenleri ve Tasarım Entegrasyonu
*   **Değişken İsimlendirmeleri:** CSS içindeki renkler, mutlaka tanımlanmış olan rollerine göre isimlendirilmelidir. Rastgele hex kodları doğrudan element stillerinde kullanılmamalı, değişkenlere atanmalıdır.
    *   *Doğru:* `--renk-primary: #6366f1;`, `--renk-success: linear-gradient(...);`
    *   *Yanlış:* `.btn { background-color: #6366f1; }` (Doğrudan hex kullanımı)
*   **Rol Tanımlamaları:** Her oyun projesinde CSS `:root` seçicisi altında aşağıdaki rollerin tanımlanması zorunludur:
    *   `--renk-arka-plan`: Oyun arka planı.
    *   `--renk-kart`: Kartlar veya paneller.
    *   `--renk-metin`: Ana metinler.
    *   `--renk-metin-ikincil`: Yardımcı metinler.
    *   `--renk-primary`: Birincil eylem (Primary).
    *   `--renk-secondary`: İkincil eylem (Secondary).
    *   `--renk-success`: Doğru cevap/başarı (Success).
    *   `--renk-error`: Yanlış cevap/hata (Error).
*   **Standart Paletler:** Renk seçimleri rastgele yapılmamalı; Figma Color Combinations veya Gradients.app standartlarına uygun, birbirini tamamlayan, kontrastı yüksek (en az WCAG AA standartlarında) kombinasyonlar kullanılmalıdır.

---

## 4. Test ve Hata Ayıklama (Geliştirici Konsolu)

Kodlama bilmeyen ekip üyeleri, oyunda bir hata (tıklamama, ekranın donması vb.) olduğunda tarayıcı konsolunu kullanarak hatayı tespit edebilir:

1.  Oyunu tarayıcıda (Chrome, Edge vb.) açın.
2.  Klavyeden **F12** tuşuna basın veya ekrana sağ tıklayıp **İncele (Inspect)** deyin.
3.  Açılan panelde **Console (Konsol)** sekmesine tıklayın.
4.  Eğer ekranda **kırmızı renkli** hata mesajları (Uncaught TypeError, ReferenceError vb.) görüyorsanız, bu hatanın ekran görüntüsünü veya metnini doğrudan Antigravity AI'a ileterek *"Şu hatayı alıyorum, düzelt"* diyebilirsiniz.
5.  Konsolda hata yoksa ve sorun mantıksal ise (örn: doğru cevaba yanlış demesi), oyun akışını AI'a adım adım anlatarak düzeltme talep edin.

---

## 5. Güvenlik ve Moderasyon Kuralları (Yasaklı API'ler)

Platforma yüklenen oyunlar yayına alınmadan önce otomatik moderasyon hattının statik analizinden geçer. **En az bir kritik bulgu oyunun otomatik reddedilmesine** yol açar. Bu yüzden AI ile kod üretirken aşağıdaki kurallara uyun:

*   **Kesinlikle Yasak (otomatik red):** `eval()`, `Function()`, `document.write`, `document.cookie`, `window.opener`, `navigator.geolocation` ve whitelist dışı dış `<script src="http...">` çağrıları. Bu API'ler oyunlarda asla kullanılmamalıdır.
*   **Mümkünse Kaçının (editör incelemesine düşürür, puanı düşürür):** `localStorage`, `indexedDB`, `navigator.sendBeacon`, `fetch()`, `XMLHttpRequest` ve `<iframe>`. Oyunlar tamamen offline çalıştığı için ağ çağrılarına gerek yoktur.
*   **Durum Saklama:** Oyun durumu (skor, ses/müzik, seçim) `localStorage` yerine bellek içi global nesnede (örn. `OYUN_DURUMU`) tutulmalıdır. `localStorage` yalnızca tema tercihi gibi zorunlu kalıcı ayarlar için, sınırlı şekilde kullanılır.
*   **Host ile İletişim:** Platforma tek meşru iletişim, gömülü `DijitalAtolye` SDK'sının `postMessage` köprüsüdür (`progress` / `complete` / `score`). Bunun dışında host penceresiyle haberleşmeye çalışmayın.
