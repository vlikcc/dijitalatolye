# AI’sız bilgi çıkarımı ve müfredat

## Veri ve doğrulama

Kaynak `../kazanim` salt okunur girdi olarak kullanılır. JSON Schema 2020-12, UTF-8, manifest SHA-256, benzersiz kimlikler, kaynak/ünite/program ilişkileri ve sınıf kapsamı doğrulanır. README hash farkı uyarıdır; veri hash farkı aktarımı durdurur. Paket scriptleri çalıştırılmaz.

Program, kaynak, ünite, kazanım, süreç bileşeni ve uygulama koleksiyonları PostgreSQL'de ayrı tablolardadır. Süreç bileşenleri JSON konumuyla ve varsa tema/ünite bağlamıyla ayrı kayıtlardır. Kaynak JSON korunur: null/boş dizi, süreçler, `unitVariants`, açıklamalar, uygulama koşulları kaybolmaz. `catalogId` bütün veri girdilerinin deterministik SHA-256 fingerprint’idir; haricî kimlik tek başına anahtar değildir. Tek aktif katalog vardır. Aktarım tek transaction ve advisory lock kullanır. Eski kataloglar silinmez; incelemeye alınmış sürümler kendi katalog kimliğini taşır.

Ders eşlemesi açık alias tablosuyla yapılır; diğer farklı resmî adlar ayrı ders olur. Sınıfı/ders bağlantısı çözülemeyen kayıt önerilmez. Programların uygulama durumları öğretim yılı ve okul türü bağlamında gösterilir; bilinmeyen durum yürürlükte kabul edilmez.

`verificationStatus` sağlayıcı paketin etiketidir. Yerel editör doğrulaması `curriculum_reviews` tablosunda ayrıca tutulur. Resmî kazanım ilişkisinin yayınlanması yerel doğrulama gerektirir; eğitimsel uygunluğun kararı her oyun için ayrıca verilir. Kaynağın veya kayıt metninin değişmesi önceki doğrulamayı geçersiz kılar. Editör ilişkiyi gerekçeyle çıkarabilir; karar ve çıkarılan kimlikler audit kaydına girer. Öğretmenin onayladığı metadata değiştirilmez, dışlanan ilişkiler ayrı tutulur.

## İşlem ve arayüzler

- `POST /api/contents`: başlık olmadan taslak oluşturabilir.
- `POST /api/contents/:id/versions`: streaming `archive`, isteğe bağlı taslak `metadata`; 202 + `versionId` döner.
- `GET /api/versions/:id/extraction`: durum, kaynak kanıtları, taslak ve revizyon; sahip/editör/yönetici erişimi.
- `PUT /api/versions/:id/metadata`: `{sha256, revision, metadata}` ile taslak kaydı.
- `POST /api/versions/:id/submit`: aynı gövdeyle tam doğrulama ve metadata dondurma. Ders/sınıf/başlık/açıklama zorunlu, kazanım isteğe bağlıdır.
- `GET /api/curriculum/programs?grade=&subjectId=&catalogId=`: program varyantları ve uygulama koşulları.
- `GET /api/curriculum/outcomes?catalogId=&programId=&subjectId=&grade=&q=&page=`: 20 kayıtlık sayfalı katalog. `versionId` verildiğinde sürümün kanıtlarıyla en fazla 10 öneri döner.
- `GET /api/curriculum/:catalogId/outcomes/:outcomeId`: program, süreçler ve kaynak konumları.
- `GET /api/curriculum/:catalogId/sources/:sourceId`: editör/yönetici için hash doğrulanmış PDF indirme. Resmî MEB HTTPS adresleri, yönlendirme ve public DNS kontrolü; cookie/oturum aktarımı yok. Kaynak 50 MiB ile sınırlıdır.
- `POST /api/curriculum/:catalogId/outcomes/:outcomeId/verify`: `{fingerprint, note, confirmed:true}`. Editörün metin/sınıf/süreç kontrolü ve bütün ilgili kaynak hash'leri kaydedilir.
- `POST /api/versions/:id/decision`: `{sha256, revision, decision, note, excludedOutcomeIds}`. Onay, kalan bütün resmî kazanımların doğrulanmasını gerektirir.

`outcomeIds` yalnız geçmiş kayıtları okumak içindir. Yeni seçim `outcomeRefs: [{catalogId,outcomeId}]`, `programId`, `academicYear`, `schoolType` alanlarıyla saklanır. Taslak kaydı revizyon artırır. Eski form ve eski sürüm işlemleri 409 döner. Gönderimden sonra değişiklik yeni sürüm gerektirir. İçerik sahipliği, doğrulanmış e-posta, personel 2FA, origin ve mutation hız sınırları korunur.

Statik çıkarıcıya yalnızca taranmış ve hash doğrulanmış dosyalar verilir. Sınırlı parser süreci secrets almadan çalışır, yüklenen kodu evaluate/import/execute etmez. `dijitalatolye.json` > HTML metadata > H1 > dosya adı başlık önceliği kullanılır. HTML metni, bağlı JS literal'leri ve yerel JSON soruları kanıt sağlar. Haricî kaynak indirme, OCR, semantik model veya oyun tarayıcısı yoktur. Yeterli kanıt yoksa öneri listesi boştur. PostgreSQL Türkçe FTS çıktılara/süreçlere öncelik verir; trigram yalnız kısa manuel sorgulara yardımcı olur. Benzerlik eğitimsel doğruluk yüzdesi değildir.

## Dağıtım ve geçiş

1. Veritabanını ve dosya volume’larını yedekleyin; web erişimini bakım durumuna alıp worker'ı durdurun.
2. Yeni commit image'larıyla `pnpm db:migrate` çalıştırın. Eski AI kuyruk işleri iptal edilir; yayımlanmamış eski inceleme işleri öğretmen onayına yönlendirilir. Yayımlanmış sürümler korunur. `ai_report` yalnız arşiv sütunudur; aktif API/UI/kararlarda kullanılmaz.
3. Güvenilir çalışma ortamında `pnpm curriculum prepare ../kazanim /tmp/dijital-curriculum-transfer` çalıştırın. Çıktı yalnız gerekli JSON'ları, şemayı ve manifesti içerir; ham PDF/HTML/scriptler ve secrets web image'ına girmez. Transfer dizinini sunucuda tek kullanımlık worker container'a salt okunur `/import` olarak bağlayıp `pnpm curriculum import /import` çalıştırın. Çıktı `catalogId` değerini kayıt altına alın. Migration ve import ayrı tek seferlik deployment işlemleridir.
4. Web için `curriculum_sources:/data/curriculum-sources` kalıcı özel volume'u bulunur. Kaynak belgeler resmî URL'den alınır; değişmiş veya erişilemeyen belge onaylanmaz. Gerekirse orijinal hash'i doğrulanmış kaynak arşivindeki PDF'yi `<sha256>.pdf` adıyla bu özel volume'a koyun. Uygulama her okumada hash'i kontrol eder. Kaynak PDF'lerini oyun Nginx'ine bağlamayın.
5. Web ve worker'ı başlatın. Dosya → tarama → metadata → öğretmen → editör → izole oyun akışını ve kazanımsız yayını kontrol edin.

AI ortam değişkenleri gerekmemektedir. Kaynak kodu haricî model sağlayıcısına gönderilmez. Yeni katalog hazırlama başarısızsa etkin katalog değişmez. Yeni aktarım eski sürüm referanslarını değiştirmez. Kod geri dönüşü için migration öncesi DB yedeği gerekir; eski uygulama yeni durum isimlerini tanımaz.

Yedekleme veritabanı ile `curriculum_sources` volume'unu kapsamalıdır. Kaynak veri paketini ve transfer fingerprint'ini sunucu dışında da saklayın. `fixtures/curriculum-test` sentetik kaynak kanıtı kullanan test verisidir, üretime aktarılmamalıdır.

## Mevcut veri paketi

26 Ekim 2026 yerel aktarımı: 15.800 kazanım ve 38.551 bağımsız süreç bileşeni; sağlayıcı etiketleri 141 `verified`, 15.659 `needs_review`; 2.438 kayıt sınıfsızdır. Katalog fingerprint’i `fac1b79cbab9d1377d3386fcb4a240d8d2307092b52358f51ad5baab24c043f2`. Hazırlanmış paket `.data/curriculum-transfer/` altındadır; Git/Docker build kapsamı dışındadır. Dağıtım için bu dizin veya aynı kaynaklardan `prepare` komutuyla üretilen eşdeğeri kullanılabilir. `transfer.json` özgün belge uyarılarını saklar; importer katalog hash’ini tekrar kontrol eder.

Arama uygulaması [PostgreSQL 17 tam metin araması](https://www.postgresql.org/docs/17/textsearch-controls.html) ve [pg_trgm](https://www.postgresql.org/docs/17/pgtrgm.html) kullanır. Otomatik öneride gösterilebilir oyun kanıtı olmayan adaylar elenir. Statik çıkarımın açıklamadığı görsel/dinamik oyunlar için öğretmenin elle seçimi esastır.
