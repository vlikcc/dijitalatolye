# Teknik rapor, editör incelemesi ve kapaklar

AI çağrısı veya yüklenen oyunu sunucuda çalıştıran tarayıcı yoktur. Statik teknik bulgular eğitimsel doğruluk kararı değildir. Bilimsel doğruluk, sınıfa uygunluk, eğitimsel kalite, erişilebilirlik ve kazanımla gerçek uyum editörün değerlendirmesidir.

## İşlem ve güven sınırları

Yükleme → ClamAV / paket yapısı / kaynaklar / kod politikası / YARA → giriş dosyası → statik bilgi çıkarımı → öğretmen bilgileri ve kapak → editör → yayın.

- Mevcut 50 MiB / 500 girdi / 200 MiB açılmış içerik ve 5 MiB kod dosyası sınırları korunur. JS/HTML/CSS ayrıştırıcısı ayrı Node sürecinde 256 MiB JS heap ve 30 saniye sınırıyla çalışır; yüklenen kod yalnızca veri olarak ayrıştırılır.
- Teknik rapor sürüm, SHA-256, giriş dosyası, kural sürümü ve benzersiz rapor kimliği taşır. ClamAV VERSION yanıtı ve YARA sürümü alınabiliyorsa kaydedilir. İlk zorunlu hata incelemeyi durdurur; kalan kontroller tamamlanmış sayılmaz.
- `resources.external`, `resources.invalid-url`, `resources.missing`: sabit yerel dosyalar ve harf duyarlılığı. HTTP, kökten başlayan yollar ve çözülemeyen dinamik fetch/import desteklenmez.
- `code.dynamic-execution`, `code.string-timer`, `code.unsupported-api`, `code.navigation`, `code.html-element`, `code.meta-refresh`: doğrudan görülen dinamik kod, ağ/worker, yönlendirme ve desteklenmeyen HTML işlemleri. Kapsam analizi yerel olarak tanımlanan işlevleri ve sıradan nesne metotlarını global tarayıcı API’lerinden ayırır.
- Bu analiz alias, obfuscation veya tüm çalışma zamanı davranışlarını çözmez. CSP, sandbox ve her sürüme ayrı oyun origin’i zorunludur. Hiçbir rapor mutlak güvenlik iddiası içermez.
- Erişilebilirlik yalnızca statik HTML kurallarını kapsar: `a11y.language`, `title`, `image-alt`, `control-label`, `label-reference`, `canvas`. `alt=""` dekoratif görsel için kabul edilir. Bir kuralın tamamlanamaması ayrıca raporlanır. Rapor 2.000 örnekle sınırlıdır; kesilme manuel inceleme gerektiren ayrı uyarı üretir.
- Klavye, odak, renk kontrastı, canvas davranışı ve dinamik ekranlar editörün güvenli önizlemede manuel kontrolüdür. Editör uyarıları kural bazında gerekçelendirir; güvenlik engelini geçersiz kılamaz.

## Kapak sözleşmesi

Öğretmenin açık seçimi → manifest kapağı → kökte tek `cover.png/jpg/jpeg/webp` → otomatik bilgi kapağı. Birden fazla aday rastgele seçilmez. Tüm desteklenen paket görselleri öğretmenin aday listesinde gösterilebilir.

`dijitalatolye.json` örneği (birinci şema sürümü de desteklenir):

```json
{
  "schemaVersion": 2,
  "title": "Kesir Mutfağı",
  "description": "Eşit parçaları seçin ve kesir sorularını yanıtlayın.",
  "grade": 4,
  "subject": "Matematik",
  "cover": { "path": "images/cover.png" }
}
```

Görsel PNG/JPEG/WebP, en fazla 5 MiB ve 20 milyon piksel olabilir. Gerçek dosya biçimi denetlenir; SVG, bozuk ve çok kareli/hareketli görseller reddedilir. Öğretmen yüklemesi önce özel `cover-inputs` alanına yazılır ve ClamAV/YARA ile taranır. Paket kapağı temiz paket manifestine karşı doğrulanır. Ham görseller hiçbir HTTP ucundan sunulmaz.

Sharp yönü düzeltir, metadata’yı kaldırır, görselin tamamını koruyarak ders zeminine yerleştirir ve 1440×880 / 720×440 WebP üretir. Otomatik kapakta yerel Manrope/Source Sans 3 TTF dosyaları ve kendi sabit ikonlarımız kullanılır. Öğretmen metninin markup karakterleri kaçırılır. Yazı tipi kaynakları ve SHA-256’ları `assets/fonts/PROVENANCE.md` içindedir.

Kapak kaydı seçim revizyonu, durum, kaynak/hash, render sürümü, üretimde kullanılan metadata revizyonu ve çıktı hash’lerini taşır. Üretim dosyaları hedef volume içindeki geçici dizinden atomik taşınır; yalnızca güncel kapak revizyonu DB’ye bağlanır. Tekrarlanan/eski iş seçim değiştiremez. Son geçerli görsel hata sırasında korunur; yeni seçimin hatası yayına gönderilmeyi engeller. İncelemeye gönderilen kapak sabitlenir. Yayımdaki kapak değişikliği aynı paketten yeni sürüm yaratır; eski yayın onaya kadar kalır.

## Sunucu arayüzleri

- `GET /api/versions/:id/technical-report`: sahibi veya editör/yönetici için teknik rapor.
- `GET /api/versions/:id/cover`: durum, metadata revizyonu ve temiz paketin adayları.
- `PUT /api/versions/:id/cover`: `{sha256, revision, coverRevision, selection}`. Seçim `{mode:"auto"}`, `{mode:"generated"}` veya `{mode:"package",path}`.
- `POST /api/versions/:id/thumbnail`: streaming raster yüklemesi. `X-Package-Sha256`, `X-Metadata-Revision`, `X-Cover-Revision` başlıkları gerekir; 202 ile worker işine döner.
- `GET /api/versions/:id/cover/image`: yalnız yetkili kullanıcıya yeniden kodlanmış özel önizleme.
- `GET /api/thumbnails/:id`: mevcut adres korunur; yalnız yayımdaki sürümün güvenli küçük kapağı.
- `POST /api/contents/:id/revisions`: `{sourceVersionId}` ile yayımdaki paketten sahip için yeni taslak; etkin başka taslak varsa 409.
- `POST /api/versions/:id/decision`: mevcut alanlara ek `review:{technicalReportId,coverId,assessment}` zorunlu. Assessment bilim/yaş/eğitim/erişilebilirlik/kapak kararlarını, her uyarının disposition ve notunu, her kazanımın catalogId/outcomeId/status/note kaydını taşır.

Tüm yazma uçları rol/sahiplik, origin, hız sınırı ve beklenen revizyonu doğrular. Yayın işi tarama, rapor, kapak, editör kararı ve dosya bütünlüğünü tekrar kontrol eder. Öğretmenin metadata kaydı ve gerekli `render-cover` kuyruğu aynı transaction içindedir. Bilgiler değiştirilip hemen gönderilirse UI önce taslağı kaydeder, kapağı bekler, sonra dondurarak gönderir.

## Editör rehberi

1. Güvenlik ve kapsam raporunu okuyun; eksik statik kontrolleri temiz sonuç olarak yorumlamayın.
2. Oyunu izole önizlemede oynayın. Bilimsel içerik/cevaplar, sınıfın okuma ve işlem düzeyi, yönergeler ve geri bildirim için karar verin.
3. Klavye, odak, okunabilirlik ve dinamik ekranları inceleyin. Uyarıları gerekçelendirin; sorun varsa düzeltme isteyin.
4. Kapağın içeriği yanıltmadan temsil ettiğini kontrol edin.
5. Her kazanımın kaynak doğrulamasını ve oyundaki somut görevin kazanımı destekleyip desteklemediğini ayrı değerlendirin. Kaynağı doğrulanmamış ilişkiyi onaylamayın. İlişki gerekçeyle çıkarılarak kazanımsız yayın yapılabilir.
6. Zorunlu başlıkların tamamı uygun olmadan onay verilemez. Yalnız bilimsel iddia içermeyen oyunlar için bilimsel doğruluk gerekçeyle uygulanamaz olabilir. Geri göndermede değerlendirilemeyen başlıklara gerekçe yazın.

## Dağıtım ve geçiş

Worker’ı durdurun; yeni worker image’ıyla migration’ları çalıştırın. `0006_technical_review_rollout` sadece yayımlanmamış güncel sürümleri yeniden taramaya alır; dondurulmuş eski bilgileri taslağa koruyarak taşır. Migration komutu eski bekleyen yayın işlerini iptal eder, eski taslak kapaklarını özel girdiye taşımayı dener ve tarama işlerini yeniden kuyruğa koyar. Eski yayımlar/kapaklar değişmez ve yeni kurallardan geçmiş gibi etiketlenmez.

Migration servisi eski taslak kapağını taşıyabilmek için `thumbnails` ve `cover_inputs` volume’larına bağlanır. Tarama, yayın ve kapak geçici dizinleri hedefleriyle aynı volume içinde bulunur.

Compose: web ve worker `cover_inputs` ile `thumbnails` kalıcı volume’larını paylaşır; oyun Nginx’i bunlara erişmez. Worker image’ında yerel TTF’ler ve fontconfig bulunur. Yedek `thumbnails.tar` artık `thumbnails`, `curriculum-sources`, `cover-inputs` içerir; temiz geri yüklemede üçünü de bağlayın. İşlem hatasında öğretmen kapak seçimini tekrar yapabilir; yönetici başarısız kapak işini yeniden kuyruğa koyabilir.
