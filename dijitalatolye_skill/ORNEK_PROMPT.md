# Yapay Zeka için Örnek Prompt Kılavuzu (ORNEK_PROMPT.md)

Bu dosya, yapay zekaya (AI) yeni bir eğitsel oyun kodlatırken veya eski bir oyunu güncellerken izleyeceğiniz iş akışını ve kullanabileceğiniz hazır prompt şablonlarını içermektedir.

---

## 1. Oyun Tasarımına Başlama İş Akışı

1.  **Görsel ve Ses Dosyası Planlaması:** Kullanacağınız medya dosyalarını belirleyin.
2.  **Yapay Zekaya Yönlendirme:** Aşağıdaki prompt şablonlarından birini kullanarak kodlamayı veya güncelleştirmeyi başlatın.
3.  **Kapak Görseli:** Oyun tamamlandıktan sonra `/kapakuret` komutuyla kapağı otomatik üretin.
4.  **Zipleme ve Yayınlama:** Oyun kodlandıktan ve test edildikten sonra `/ziple [oyun-adi]` komutunu çalıştırın. Yapay zeka projeyi zip paketi haline getirecektir.

---

## 2. Kopyala-Yapıştır Prompt Şablonları

Kullandığınız araca göre aşağıdaki şablonlardan birini kopyalayıp köşeli parantez içindeki `[...]` alanları düzenleyerek yapay zekaya gönderebilirsiniz:

### A. Antigravity IDE veya Ajanlar için (Klasörü Otomatik Kopyalayan Yapı)

Eğer dosya sistemine doğrudan erişimi olan agentic bir yapay zeka (Antigravity vb.) kullanıyorsanız, klasörü sizin yerinize kopyalamasını ve adlandırmasını isteyebilirsiniz:

```text
Lütfen projemizin ana dizinindeki ".antigravity/rules.md" kurallarına ve "MIMARI.md" dosyasındaki letterbox/ölçeklendirme mimarisine birebir uyarak aşağıdaki adımları gerçekleştir:

1. Ana dizindeki "sablon/" klasörünü kopyala ve yeni oluşturacağımız oyunun adı olan "[oyun-klasoru-adi]" (Türkçe karakter içermeyen, tamamen küçük harflerle ve kelimeler arası tire ile, örn: "saat-eslestirme") adıyla yeni bir klasör oluştur.
2. Bu yeni oluşturduğun "[oyun-klasoru-adi]/index.html" dosyasının içeriğini güncelleyerek yeni oyunumuzu kodla.

Geliştirilecek Oyun:
- Konu/Kazanım: [Örn: 2. Sınıf Saat Okuma ve Zamanı Öğrenme]
- MEB Kazanım Kodu: [Örn: M.2.3.1 - varsa girin; şablondaki KAZANIM_KODU sabitini bununla güncelle. Yoksa GENEL.0.0 kalsın.]
- Oyun Mantığı ve Akışı: [Örn: Öğrenciye dijital bir saat gösterilecek. Öğrenci analog saatin akrep ve yelkovanını doğru zamana ayarlamaya çalışacak.]
- Tasarım Dili ve Renk Paleti: [Örn: Orman konseptli. Tasarımlarda Figma Color Combinations ve Gradients.app standartlarına uygun, kontrastı yüksek (en az WCAG AA uyumlu), yumuşak gradyan geçişlerine sahip bir palet kullan. Renk rolleri net olsun: Primary (ana butonlar), Secondary (ayarlar/geri butonları), Success (yeşil), Error (kırmızı) ve Background (koyu orman yeşili arka plan).]

Kurallar ve İş Akışı:
1. Şablondaki Giriş Ekranı, Ses Açma/Kapama, Yatay Ekran Kilidi Uyarısı, Pop-out Modal pencereleri (Akıllı Tahta uyumluluk görsel rozeti) ve Sonuç Ekranı şablonunu koru ve bu oyuna uyarla.
2. Cihaz uyumluluk rozetlerinde sadece görselleri/ikonları göster, yanlarında metin açıklaması yazmasın.
3. Görsel, ses, video veya yazı tipi için internetten link (CDN/URL) KULLANMA. Şablondaki yerel @font-face (font/) yapısını koru. Ayrıca moderasyon statik analizinden geçebilmesi için eval(), Function(), document.write, document.cookie, window.opener, navigator.geolocation ve dış <script src="http..."> KESİNLİKLE kullanma; localStorage/indexedDB/fetch/XMLHttpRequest/iframe'den kaçın (oyun durumunu bellek içi tut, localStorage'ı yalnızca tema tercihi için kullan).
4. Şablondaki gömülü DijitalAtolye İçerik İzleme SDK bloğunu silme; KAZANIM_KODU sabitini güncelle, doğru adımlarda DijitalAtolye.progress(...) ve oyun bitiminde DijitalAtolye.complete(...) çağrılarını oyunun mantığına bağla.
5. Kodu önce yaz. Kod içinde ihtiyaç duyduğun görseller ve sesler için yerel yollar tanımla (Örn: gorsel/saat_kadran.png, ses/dogru_cevap.mp3).
6. Kodlamayı tamamladıktan sonra, benden bu görsellerin ve seslerin yerine koymam gereken tüm medya dosyalarını dosya isimleriyle birlikte bir liste halinde talep et.
```

### B. ChatGPT veya Claude Web Arayüzü için (Klasörü Sizin Kopyaladığınız Yapı)

Eğer web arayüzünden çalışıyorsanız, klasörü önce manuel olarak kopyalayıp adlandırdıktan sonra şu promptu kullanın:

```text
Lütfen projemizin ana dizinindeki ".antigravity/rules.md" kurallarına ve "MIMARI.md" dosyasındaki letterbox/ölçeklendirme mimarisine birebir uyarak, kopyalayıp oluşturduğum [oyun-klasoru-adi]/index.html dosyasının içeriğini güncelle ve yeni oyunumuzu kodla.

Geliştirilecek Oyun:
- Konu/Kazanım: [Örn: 2. Sınıf Saat Okuma ve Zamanı Öğrenme]
- MEB Kazanım Kodu: [Örn: M.2.3.1 - varsa girin; şablondaki KAZANIM_KODU sabitini bununla güncelle. Yoksa GENEL.0.0 kalsın.]
- Oyun Mantığı ve Akışı: [Örn: Öğrenciye dijital bir saat gösterilecek. Öğrenci analog saatin akrep ve yelkovanını doğru zamana ayarlamaya çalışacak.]
- Tasarım Dili ve Renk Paleti: [Örn: Orman konseptli. Tasarımlarda Figma Color Combinations ve Gradients.app standartlarına uygun, kontrastı yüksek (en az WCAG AA uyumlu), yumuşak gradyan geçişlerine sahip bir palet kullan. Renk rolleri net olsun: Primary (ana eylemler), Secondary (ayarlar/geri), Success (doğru cevap), Error (yanlış cevap) ve Background (koyu arka plan).]

Kurallar ve İş Akışı:
1. Şablondaki Giriş Ekranı, Ses Açma/Kapama, Yatay Ekran Kilidi Uyarısı, Pop-out Modal pencereleri (Akıllı Tahta uyumluluk görsel rozeti) ve Sonuç Ekranı şablonunu koru ve bu oyuna uyarla.
2. Cihaz uyumluluk rozetlerinde sadece görselleri/ikonları göster, yanlarında metin açıklaması yazmasın.
3. Görsel, ses, video veya yazı tipi için internetten link (CDN/URL) KULLANMA. Şablondaki yerel @font-face (font/) yapısını koru. Ayrıca moderasyon statik analizinden geçebilmesi için eval(), Function(), document.write, document.cookie, window.opener, navigator.geolocation ve dış <script src="http..."> KESİNLİKLE kullanma; localStorage/indexedDB/fetch/XMLHttpRequest/iframe'den kaçın (oyun durumunu bellek içi tut, localStorage'ı yalnızca tema tercihi için kullan).
4. Şablondaki gömülü DijitalAtolye İçerik İzleme SDK bloğunu silme; KAZANIM_KODU sabitini güncelle, doğru adımlarda DijitalAtolye.progress(...) ve oyun bitiminde DijitalAtolye.complete(...) çağrılarını oyunun mantığına bağla.
5. Kodu önce yaz. Kod içinde ihtiyaç duyduğun görseller ve sesler için yerel yollar tanımla (Örn: gorsel/saat_kadran.png, ses/dogru_cevap.mp3).
6. Kodlamayı tamamladıktan sonra, benden bu görsellerin ve seslerin yerine koymam gereken tüm medya dosyalarını dosya isimleriyle birlikte bir liste halinde talep et.
```

---

## 3. Eski Oyunu Güncellemek İçin Örnek Prompt

Eski ve standart dışı bir oyunu `/oyunguncelle` komutu ile şablona uyarlamak için şu promptu kullanabilirsiniz:

```text
Lütfen projemizdeki "oyunguncelle/" klasörünün altına kopyaladığım "[eski-oyun-klasor-adi]" projesini incele:
1. Oyunun kodunu ve varlıklarını rules.md kuralları ile MIMARI.md teknik şablonlarına (Letterbox ölçekleme, tek dosya standardı, yerel yollar) göre analiz et.
2. Yapılması gereken tüm değişiklikleri (renk paletinin Figma/Gradients.app standartlarına güncellenmesi, snake_case dosya isimlendirmeleri vb.) bana raporla ve benden ONAY iste.
3. Ben onay verdikten sonra, orijinal klasöre kesinlikle dokunmadan, yeni bir "[eski-oyun-klasor-adi]-guncellenmis" klasörü oluşturarak güncel sürümü oraya kaydet.
```

---

## 4. Somut Örnek Prompt: "Gezegen Sıralama Oyunu"

Aşağıda, ekibinizin yapay zekaya (örneğin Antigravity IDE'ye otomatik klasör kopyalatmak için) doğrudan gönderebileceği gerçekçi bir prompt örneği yer almaktadır:

```text
Lütfen projemizin ana dizinindeki ".antigravity/rules.md" kurallarına ve "MIMARI.md" dosyasındaki letterbox/ölçeklendirme mimarisine birebir uyarak aşağıdaki adımları gerçekleştir:

1. Ana dizindeki "sablon/" klasörünü kopyala ve yeni oluşturacağımız oyunun adı olan "gezegen-siralamaca" adıyla yeni bir klasör oluştur.
2. Bu yeni oluşturduğun "gezegen-siralamaca/index.html" dosyasının içeriğini güncelleyerek yeni oyunumuzu kodla.

Geliştirilecek Oyun:
- Konu/Kazanım: Fen Bilimleri - Güneş Sistemi ve Gezegenlerin Güneş'e olan uzaklık sıralaması.
- MEB Kazanım Kodu: F.6.1.2 (şablondaki KAZANIM_KODU sabitini bununla güncelle).
- Oyun Mantığı ve Akışı:
  * Giriş ekranında uzay temalı bir görsel ve oyun kuralları olacak.
  * Oyunda Güneş sabit duracak. Karışık olarak verilen 4 gezegen (Dünya, Mars, Jüpiter, Satürn) sürükle-bırak veya tıklayarak seçip yörüngelerine yerleştirilecek.
  * Yanlış yörüngeye yerleştirildiğinde "Yanlış! Çünkü Dünya Güneş'e 3. sırada yer alır." şeklinde açıklayıcı modal geri bildirimi verilecek.
  * Doğru yerleştirildiğinde ise yeşil tebrik modalı çıkacak.
- Tasarım Dili ve Renk Paleti: Koyu kozmik arka plan (koyu lacivert ve mor gradyanlar). Figma ve Gradients.app standartlarına uygun yumuşak geçişler, gezegenler için yuvarlak cam (glassmorphic) taşıma kartları.

Kurallar ve İş Akışı:
1. Şablondaki Giriş Ekranı, Ses Açma/Kapama, Yatay Ekran Kilidi Uyarısı, Pop-out Modal pencereleri (Akıllı Tahta uyumluluk görsel rozeti) ve Sonuç Ekranı şablonunu koru ve bu oyuna uyarla.
2. Cihaz uyumluluk rozetlerinde sadece görselleri/ikonları göster, yanlarında metin açıklaması yazmasın.
3. Görsel, ses, video veya yazı tipi için internetten link (CDN/URL) KULLANMA. Şablondaki yerel @font-face (font/) yapısını koru. Ayrıca moderasyon statik analizinden geçebilmesi için eval(), Function(), document.write, document.cookie, window.opener, navigator.geolocation ve dış <script src="http..."> KESİNLİKLE kullanma; localStorage/indexedDB/fetch/XMLHttpRequest/iframe'den kaçın (oyun durumunu bellek içi tut, localStorage'ı yalnızca tema tercihi için kullan).
4. Şablondaki gömülü DijitalAtolye İçerik İzleme SDK bloğunu silme; KAZANIM_KODU sabitini F.6.1.2 yap, gezegen doğru yerleştirildiğinde DijitalAtolye.progress(...) ve oyun bitiminde DijitalAtolye.complete(...) çağrılarını ekle.
5. Kodu önce yaz. Kod içinde ihtiyaç duyduğun görseller ve sesler için yerel yollar tanımla (Örn: gorsel/dunya.png, gorsel/mars.png, ses/gezegen_dogru.mp3).
6. Kodlamayı tamamladıktan sonra, benden bu görsellerin ve seslerin yerine koymam gereken tüm medya dosyalarını dosya isimleriyle birlikte bir liste halinde talep et.
```
