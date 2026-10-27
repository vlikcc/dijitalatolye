# Doğrulama kaydı

## 27 Ekim 2026 — teknik rapor, editör formu ve kapak yönetimi

Bu ek kayıt AI’sız teknik değerlendirme ve kapak planını kapsar. Oyun kodu sunucuda çalıştırılmadı; Sharp ile raster üretildi. Test tarayıcısı yalnız kontrollü demo fixture’ını kullanıcı akışı doğrulaması için açtı; otomatik oyun ekran görüntüsü servisi eklenmedi.

| Kontrol | Sonuç |
|---|---|
| TypeScript strict ve birim testleri | `pnpm typecheck`; 7 dosyada 55 Vitest testi geçti. AST kapsam çözümü, oyun işlevlerinde `open()` yanlış pozitifleri, doğrudan yasaklı API’ler, statik erişilebilirlik, zorunlu eğitimsel değerlendirme, manifest v1/v2, kapak sırası, gerçek görsel biçimi, 5 MiB/20 MP, EXIF ve hareketli WebP kontrolleri |
| Gerçek PostgreSQL/ClamAV/YARA entegrasyonu | 4 dosyada 29 test geçti. Kuyruk transaction rollback, EICAR ve tarayıcı kesintisi, ZIP saldırıları, sahiplik, gecikmiş işler, tekrarlı yayın, eski rapor/kapak/revizyon, uyarıya gerekçe, kaynak doğrulaması, kayıp kapakta önceki yayını koruma |
| Docker ayrı volume testi | `ready`, `published` ve `thumbnails` ayrı Docker volume’larıyla aynı 29 entegrasyon testi geçti. Geçici dosyalar atomik rename için hedef volume içinde oluşturulur; EXDEV riski giderildi. Yalnız bu test için oluşturulan üç volume sonrasında kaldırıldı |
| Playwright / Compose | 47 senaryo geçti; öğrenci pilotunun opt-in testi kapsam dışında kapalı olduğu için 1 test atlandı. Gerçek ZIP → tarama → paket kapağı → öğretmen yüklemesi → otomatik kapak → zorunlu editör formu ve canvas uyarısı → yayın → anonim yerel modül/fetch. Aynı paketten yeni taslak ve önceki yayını koruma; özel kapağa başka öğretmen erişiminin ve dondurulmuş kapak değişikliğinin reddi |
| Kapak üretimi | Gerçek Sharp çıktıları 1440×880 ve 720×440 WebP olarak doğrulandı. Türkçe uzun başlık ve literal `<b>oyun</b>` içeren çıktı açılarak satır kırılması/kırpılma kontrol edildi; markup düz metin kaldı |
| Temiz migration | Yeni geçici PostgreSQL DB’de 7 migration geçti; `technical_report`, `cover`, `review_snapshot` kolonları ve scan/extract-metadata/render-cover/publish kuyrukları sorguyla doğrulandı. Geçici DB kaldırıldı |
| Geçiş ve yeniden başlatma | Yerel worker durdurularak migration tekrar çalıştırıldı. `tests/ops/compose-recovery.ts`: worker kapalıyken kuyrukta kalan yeni HTML, web/worker yeniden oluşturulduktan sonra teknik rapor ve hazır kapakla `needs_metadata` durumuna ulaştı. Mevcut yayın Nginx üzerinden 200 döndü |
| Dağıtım tanımı | Üretim Compose `config --quiet`, yedek betiği `bash -n` geçti. Migration eski taslak kapağını taşıyabilmek için thumbnails/cover_inputs volume’larına bağlanır. Kaynak kapaklar yedek kapsamına eklendi |
| Üretim image’ları | Node 24 Linux worker ve Next.js standalone web image’ları üretildi. Worker yerel fontları ve fontconfig’i içerir; AI anahtarı gerekmez. Image içinde fontlar/fontconfig, web standalone `server.js` ve `.env`/ham müfredat/fixture dışlama kontrolleri geçti |

Katalog testlerindeki sabit 16 oyun varsayımı, gerçek akışın yayımladığı ek demo içeriğini de hesaba katacak şekilde düzeltildi; filtre, URL, geri/ileri ve temizleme davranışı korunarak sınandı. Ünite/entegrasyon toplamları repository’de eşzamanlı eklenen öğrenme modülü testlerini de içerir; yukarıdaki özellik kapsamı bunlardan ayrıdır.

Görsel kanıtlar `.impeccable/review/technical-{metadata,editor}-{360,768,1440}.png`, `cover-detail-*`, `assessment-detail-*` ve `cover-long-title.webp` dosyalarındadır. Sayfa ve bileşen görüntüleri açılıp içeriklerinin geçerliliği kontrol edildi. Bağımsız Impeccable incelemesi bu 12 ekran görüntüsünü ve uzun başlıklı kapağı açarak `ship` kararı verdi; incelenen görsel/UX kapsamı için maddi düzeltme istemedi. Rapor `.impeccable/review/technical-finish-review.md` içindedir. Bu karar backend güvenlik sertifikası değildir. Bağımsız belgeleme adımı `.impeccable/surfaces/src-components-cover-editor-tsx.md` kaydını oluşturdu; `DESIGN.md` ve `.impeccable/design.json` önce/sonra SHA-256 karşılaştırmasıyla değişmeden korundu. Son image’lar yerelde başlatıldı ve `/api/health` başarılı yanıt verdi.

Bu sonuçlar bütün JavaScript davranışlarının güvenli olduğunu veya eğitimsel doğruluğu kanıtlamaz. Kaynak kodu statik incelenir; sandbox/CSP/ayrı origin ve editörün manuel kararı zorunludur. Gerçek Dokploy dağıtımı, wildcard DNS/TLS, haricî SMTP ve sunucu dışı tam yedekten dönüş bu yerel doğrulamanın kapsamında değildir. Context7 MCP erişilemedi; Sharp ve W3C resmî belgeleri kullanıldı.

---

26 Ekim 2026. macOS üzerinde Docker Desktop Linux konteynerleri; Node 24.21.0, PostgreSQL 17.9, gerçek ClamAV 1.4.3 ve YARA. Bu kayıt AI’sız bilgi çıkarımı / müfredat geçişini kapsar. Çalışma `next-platform/` içindedir; eski uygulamalar ve `kazanim` kaynak paketi değiştirilmedi.

## Çalıştırılan kontroller

| Kontrol | Sonuç / kanıt |
|---|---|
| TypeScript strict | `pnpm typecheck` başarılı |
| Vitest birim | 34 test / 4 dosya geçti. Paket sınırları, traversal, symlink, case çakışması, kaynak referansları, streaming upload; manifest/DOM/AST/JSON çıkarımı, kaynak konumları, bozuk metadata, canvas/boş metin, büyük JS, kütüphane dışlama, sınırlı parser süreci, Türkçe karakterler ve MEB URL sınırları |
| Gerçek servis entegrasyonu | 15 test / 2 dosya geçti. PostgreSQL/pg-boss transaction, yeniden başlatma ve idempotent yayın; EICAR/ClamAV kesintisi; preview/sahiplik; eski sürüm ve revizyon; başarısız yayın hazırlığında önceki yayının korunması; katalog tekrarı, bozuk hash/kırık ilişki/yarım transaction rollback; kanıtlı öneri ve ilgisiz metinde boş sonuç; metadata dondurma, tekrarlanan çıkarımda öğretmen değişikliklerinin korunması; kaynak doğrulaması ve gerekçeli kazanımsız yayın |
| Gerçek kaynak paketi | 15.800 kazanım, 38.551 süreç bileşeni; 141 sağlayıcı etiketli `verified`, 15.659 `needs_review`, 2.438 sınıfı çözülemeyen kayıt. Tek etkin katalog. Aynı paket tekrar aktarılınca kayıt sayısı değişmedi; farklı programlarda bulunan 2.480 ortak resmî kod birleştirilmedi |
| Aktarım paketi | `.data/curriculum-transfer` üretildi, yeniden hash/şema kontrolü ve idempotent import geçti. Kaynak README hash farkı belge uyarısı olarak korundu |
| Gerçek MEB PDF | `source-ab68b04857b89189` resmî HTTPS adresinden indirildi; kayıtlı SHA-256 ile eşleşti ve özel önbelleğe yazıldı. Bu kontrol PDF bütünlüğünü gösterir; kazanımların metnini editör adına onaylamaz |
| Playwright | 36 senaryo geçti (yaklaşık 1,2 dakika). Dosya önce yüklenir; gerçek worker tarar/çıkarır; öğretmen program ve kazanım seçer, taslağı kaydeder/geri açar/onaylar; TOTP editör kaynakları görür, doğrulanmamış ilişkiyle onay 409 alır, gerekçeyle ilişkiyi çıkarır; anonim ziyaretçi JS modülü ve yerel fetch kullanan oyunu oynar. Doğrudan erişim yayından kaldırmada kesilir ve yeni sürüm tekrar taranarak yayımlanır |
| Responsive / klavye | Yeni metadata ve kaynak inceleme ekranlarında 360/768/1440 taşma kontrolü ve görseller; katalog/oyuncuda 320–1440 boyutları, klavye, görünür odak, URL filtreleri, azaltılmış hareket, fullscreen/sinema modu ve yön değişiminde oyun ilerlemesi |
| Üretim derlemesi | Next.js standalone web ve Linux worker image’ları üretildi; AI anahtarı ve model çağrısı gerekmiyor |
| Temiz veritabanı | Beş sürümlenmiş migration yeni geçici DB’de geçti; 12 sınıf, uygulama tabloları ve scan/extract-metadata/publish kuyrukları doğrulandı. Geçici DB kaldırıldı |

Entegrasyon testleri yalnız `_test` son ekli veritabanında çalışır:

```sh
docker compose -f deploy/compose.dev.yml -f deploy/compose.worker-dev.yml \
  -f deploy/compose.web-dev.yml run --rm --no-deps \
  -e DATABASE_URL=postgresql://app:local-only@postgres:5432/dijital_test \
  -e DATA_DIR=/tmp/dijital-integration worker pnpm test:integration
```

E2E web/worker/Nginx/ClamAV/PostgreSQL/Mailpit Compose ortamında çalıştı. `fixtures/demo-game.zip` gerçek tarama hattından geçti. Test parolaları rastgele üretilir; Mailpit dışında e-posta alıcısına gönderim yapılmaz. `fixtures/curriculum-test` içindeki sentetik PDF yalnız kaynak inceleme iş kuralını test eder; üretim kataloguna eklenmedi. Gerçek kaynak paketi uygulama DB’sinde, sentetik katalog ayrı test DB’sindedir.

Katalog fingerprint’i:

```text
fac1b79cbab9d1377d3386fcb4a240d8d2307092b52358f51ad5baab24c043f2
```

## Görsel inceleme

Keşif Atlası tasarımı korundu. Yeni dosya yükleme, kaynaklı metadata ve editör kaynak inceleme ekranları `.impeccable/review/` altında 360/768/1440 genişliklerde yakalandı. Yeni form alanlarının kaynak açıklamaları `aria-describedby` ile bağlandı. Kaydetme sırasında formun değişmesini önleyen disabled durumları, boş sonuç/çıkarım notu/kaynak incelemesi gerekli durumları bulunur.

Impeccable’ın bağımsız son inceleme ve belgeleme adımları bu ekranlar için tamamlandı; kapsam ve son karar aşağıdadır. Mevcut kamu ekranlarının önceki inceleme kararları yeni müfredat ekranlarına otomatik olarak taşınmaz.

## Canlı ortamda henüz doğrulanmayanlar

- Dokploy/Traefik, iki ayrı kayıtlı kök domain ve wildcard DNS/TLS. Yerel test origin’leri `*.games.localhost`; canlıda bu istisna kullanılamaz.
- Gerçek SMTP teslimatı/kotaları; yerel doğrulama Mailpit ile yapıldı.
- Bütün MEB kaynaklarının erişilebilirliği ve 15.800 kaydın resmî metin doğruluğu. Bir gerçek PDF’nin hash kontrolü bütün kataloğun doğrulanması değildir; editör kaynak incelemesi gerekli olmaya devam eder.
- Sunucu dışı Restic hedefi, günlük zamanlayıcı ve temiz sunucuda tam dosya+DB restore provası. RPO 24 saat / RTO 4 saat hedefleri ölçülmüş sonuç değildir.
- Gerçek kullanıcı yükünde kapasite, Safari/Firefox ve fiziksel yardımcı teknoloji testleri.

Context7 MCP erişilemedi; kurulu paket tipleri ve resmî Next.js/Better Auth/pg-boss/PostgreSQL belgeleri kullanıldı. Dağıtım ve geçiş için `DEPLOYMENT.md` ve `CURRICULUM.md` içindeki işlemler izlenmelidir.

## Operasyon kontrolleri

`tests/ops/compose-recovery.ts` yeni akışla geçti: worker kapalıyken kuyruğa alınan HTML, web/worker yeniden oluşturulduktan sonra `needs_metadata` durumuna ulaştı; mevcut yayımlı oyun Nginx üzerinden erişilebilir kaldı. Production Compose test değerleriyle `config --quiet` kontrolünden geçti. Web standalone image’ında `server.js` bulundu; `.env`, `kazanim` ve test fixture dizinleri bulunmadı. `bash -n deploy/backup.sh` başarılıdır; gerçek Restic restore provası yapılmış değildir.

## Son Impeccable kararı

Bağımsız inceleme, ilk mobil capture’ın alt kısmı eksik olduğu için yeniden çekim istedi. Geçerli sekiz görüntü üzerinden dört düzeltme belirlendi: seçili kazanımda doğrulama etiketi, bütün önerilen alanlarda kaynak konumu, kaynak bağlantılarında görünür alt çizgi, kayıt sırasında editör alanlarının kilitlenmesi. Bunlar tek grup halinde düzeltildi ve aynı ekranlar yeniden yakalandı. Son karar **`ship`**: dört bulgu çözüldü; bu karar puanlanan düzeltmelerin kapsamındadır, bütün uygulama veya güvenlik sertifikası değildir.

Son yeniden yakalamada gerçek ZIP’e isteğe bağlı `dijitalatolye.json` test manifesti eklendi; sınıf/ders/program kaynakları ve kayıt sonrası seçili kazanımın “Kaynak incelemesi gerekli” etiketi tarayıcıda doğrulandı. Sonraki sürüm manifest içermeyen özgün demo ZIP’iyle tekrar tarandı; onay yeni dosya hash’iyle yapıldı.

Belgeleme adımında `.impeccable/surfaces/src-components-metadata-editor-tsx.md` eklendi. Mevcut `DESIGN.md` ve `.impeccable/design.json` SHA-256 karşılaştırmasıyla değişmeden korundu; özellik mevcut tasarım sisteminin uzantısıdır. Önceden var olan featured-card hover açıklaması farkı bu iş kapsamında değiştirilmedi. Son form düzeltmeleri ve manifestli/manifestsiz yeni sürüm akışı sonrası lifecycle testi yeniden geçti (23,7 saniye); TypeScript kontrolü tekrar başarılıdır.
