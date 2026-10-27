# Dijital Oyun Atölyesi / Next platform

Bağımsız Next.js 16 / React 19 uygulaması. PostgreSQL 17, Drizzle, Better Auth, Tailwind 4 ve shadcn/ui temeli. Tek repository içinde web + pg-boss worker. Eski .NET, Angular ve Guard koduna bağımlı değildir.

## Yerel geliştirme

Node 24, pnpm 10.30.3 ve Docker gerekir. Komutlar `next-platform` içinde çalıştırılır.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
# .env içindeki üç secret değerini ayrı, rastgele en az 32 karakterle değiştirin.
docker compose -f deploy/compose.dev.yml up -d
pnpm db:migrate
pnpm seed
pnpm dev
```

Web: http://localhost:3000. Test e-posta kutusu: http://localhost:58025. Geliştirmede gerçek e-posta gönderilmez; Mailpit yakalar. PostgreSQL ve diğer geliştirme portları yalnızca localhost'a bağlıdır.

Worker ve oyun sunucusu:

```sh
mkdir -p .data/ready .data/published
docker build --target worker -t dijital-next-worker:dev .
docker compose -f deploy/compose.dev.yml -f deploy/compose.worker-dev.yml up -d --no-build worker games
```

ClamAV imajı AMD64 olduğundan ARM geliştirme makinelerinde Docker emülasyonu kullanılır. İlk antivirüs imza yüklemesi biraz sürebilir; hazır olmadan tarama hata verir ve tekrar denenir. `.data` yalnızca yerel dosya alanıdır, Git'e eklenmez.

Web'i de Docker içinde çalıştırmak için host'taki `pnpm dev` sürecini kapatıp:

```sh
docker build --target web --build-arg GAME_BASE_DOMAIN=games.localhost -t dijital-next-web:dev .
docker compose -f deploy/compose.dev.yml -f deploy/compose.worker-dev.yml -f deploy/compose.web-dev.yml up -d --no-build
```

Bu üç dosyalı yerel Compose, uçtan uca testte kullanılan düzendir. Canlı için aşağıdaki tek production Compose dosyasını kullanın; yerel `local-test` istisnası ve Mailpit canlıya taşınmaz.

Bir öğretmen hesabı oluşturun, Mailpit'teki bağlantıyla doğrulayın. İlk yönetici için:

```sh
pnpm bootstrap-admin kendi-adresiniz@example.com
```

Bu komut yalnızca doğrulanmış mevcut hesaba ve yalnızca henüz yönetici yokken uygulanır. Tekrar giriş yapın; `/hesap` sayfasında doğrulayıcı uygulama ve yedek kodlarla 2FA kurun. Sonraki editör/yönetici rolleri yönetim ekranından atanır. Rol değişikliği kullanıcının mevcut oturumlarını kapatır.

## Gerçek oyun akışı

### Keşif Atlası demoları

`DEMO_CATALOG_ENABLED=true` yerel ortamda 16 kısa etkinliği açar. Varsayılanı kapalıdır; `.env.example` içinde `false` bulunur. Bu etkinlikler veritabanına eklenmez ve editör onayından geçmiş öğretmen içeriği gibi sunulmaz. Her birinde **Demo** etiketi, öğrenme hedefi ve öğretmen notu vardır. Bayrak kapalıyken katalog, detay ve demo HTML adresleri bu etkinlikleri sunmaz.

`/` ve `/kesfet` aynı içerik havuzunu kullanır. Arama, ders, sınıf ve kaydedilenler filtreleri URL'dedir; `/icerik/[slug]` inceleme ve oynama ekranıdır. Eski `/oyna/[slug]` adresleri oyunu otomatik başlatan detay adresine yönlenir. Katalogdaki favorilere kaydetme mevcut tarayıcıda tutulur. Öğrenci hesabı, sınıf/ödev ve oyun ilerlemesi ayrı, varsayılan kapalı modüldür; [öğrenci ve oyun kaydı](docs/STUDENT-LEARNING.md) belgesine bakın.

Demo kaynakları `src/games/` içindedir. Seçim, eşleştirme, sıralama ve sınıflandırma işlemlerinin tamamı düğmelerle, klavyeyle veya dokunarak yapılabilir. `/demo-games/[slug]` bağımsız HTML sunar ve `sandbox="allow-scripts"` ile çalışır. Kullanıcı yüklemelerinin ayrı origin'i, tarama ve yayın hattı korunmuştur.

```sh
pnpm exec playwright install chromium
pnpm demos:build
```

Bu komut önce Türkçe karakterleri içeren Manrope ve Source Sans 3 fontlarını lisans metinleriyle bağımsız HTML içine gömer; iframe font yüklemek için haricî ağ isteği yapmaz. Ardından `fixtures/atlas/` altında 16 bağımsız HTML ve `public/game-covers/` altında gerçek oyun sahnelerinin kapaklarını üretir. Köken bilgisi `.impeccable/assets/game-covers.json` içindedir. Görseller yenilenirse Impeccable'ın `embed-prompt` komutuyla aynı köken bilgisi görsellere de işlenir; `embed-prompt --scan public/brand public/game-covers src/app/icon.png` eksikleri gösterir.

Yeni şeffaf yatay logo `public/brand/logo-horizontal.png`, bağımsız simge `public/brand/puzzle-mark.png` içindedir. Arayüz küçük boyutlarda simgeyi gerçek HTML marka yazısıyla birleştirir. Manrope ve Source Sans 3, Türkçe karakterleri kapsayan font dosyalarıyla yerelden sunulur.

Demo E2E paketi için web sunucusunda bayrağı açıp `pnpm test:e2e tests/e2e/atlas.spec.ts` çalıştırın. Playwright komutlarını aynı çıktı dizininde eşzamanlı çalıştırmayın. [Keşif Atlası doğrulama kaydı](docs/ATLAS-VERIFICATION.md), yeni ekranların kanıtlarını ve kapsam sınırlarını listeler.

### Öğretmen içerikleri

`fixtures/demo-game.zip` çok dosyalı, JavaScript modülü ve yerel JSON `fetch` kullanan oynanabilir demo içerir. Kaynakları `fixtures/demo/` içindedir; paket `node --import tsx scripts/demo-zip.ts` ile yeniden üretilebilir. Otomatik seed yalnızca dört ders ekler; hiçbir içeriği tarama/onay atlayarak yayımlamaz.

Öğretmen yükler → özel karantina → ClamAV + YARA + paket doğrulama → statik bilgi çıkarımı → öğretmenin bilgi onayı → editör incelemesi → yayın dosyalarının hash kontrolü → atomik yayın referansı. Yeni sürüm incelenirken eski yayın değişmez. Aynı iş tekrar çalıştırılabilir. Eski sürüm kararları yeni sürüme uygulanamaz.

Oyun paketi HTML veya ZIP; 50 MB yükleme, 500 girdi, 200 MB açılmış içerik sınırı vardır. Her kod dosyası en fazla 5 MB. Paket içinde HTML/CSS/JS/modül, JSON, görsel, ses, video ve fontlar desteklenir. `index.html` varsayılan; manifestin `entrypoint` alanı isteğe bağlıdır. Birden fazla HTML ve varsayılan giriş yoksa öğretmen seçim yapar. Arşiv şifreleme, iç içe arşiv, symlink, case çakışması, sunucu çalıştırılabilirleri ve dış kaynaklar reddedilir. Statik inceleme nedeniyle `fetch` ve dinamik `import` sabit göreli yol kullanmalıdır; Worker/WebSocket/XHR/WASM bu sürümün paket sözleşmesinde yoktur.


## Testler

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

E2E, çalışan yerel web/worker/Nginx/ClamAV/PostgreSQL/Mailpit ister. Gerçek e-posta doğrulaması, TOTP, HTML/ZIP yüklemesi, ayrı origin'de JavaScript + local fetch, editör yayını, erişim kontrolü ve yayından kaldırmayı test eder. Yerel demo hesapları ve içerikleri oluşturur. Parolalar test sırasında rastgele üretilir; sabit test giriş bilgisi yoktur. Görsel kanıtlar `.impeccable/review/` altına kaydedilir.

Entegrasyon testleri **ayrı `_test` son ekli veritabanı** gerektirir; normal uygulama DB'sinde çalışmayı reddeder:

```sh
docker compose -f deploy/compose.dev.yml exec -T postgres createdb -U app dijital_test
# Kendi kabuğunuzda DATABASE_URL değerini dijital_test veritabanına yönlendirin.
DATABASE_URL=postgresql://app:local-only@127.0.0.1:55432/dijital_test pnpm db:migrate
DATABASE_URL=postgresql://app:local-only@127.0.0.1:55432/dijital_test pnpm test:integration
```

Host'ta `yara` bulunmalı; alternatif olarak worker image'ında aynı testi çalıştırın. Testler gerçek ClamAV/YARA kullanır; temiz sonuç taklidi yoktur. Test verileri yalnızca test veritabanında birikir; temiz test DB'si/volume ile başlanabilir.

Yerel Docker ortamında süreç yenileme kontrolü: `node scripts/with-env.mjs node --import tsx tests/ops/compose-recovery.ts`. Bu komut worker'ı kısa süre durdurur, özel bir demo taslağı kuyruğa ekler, web/worker konteynerlerini yeniden oluşturur ve işin öğretmen bilgi onayı aşamasına ulaşmasını bekler. Yerel geliştirme ortamı dışında çalışmayı reddeder. Kullanıcı akışından ayrı bir operasyon testidir; canlı sunucuda çalıştırmayın.

`pnpm build` Webpack kullanır; bu ortamın Turbopack alt süreç port kısıtını aşar. `pnpm start` standalone çıktısını çalıştırır; postbuild statik dosyaları kopyalar ve izleyicinin çıktıya kopyalayabildiği `.env` dosyalarını temizler. Yerelde üretim sunucusu denemek için yalnızca yerel ortamda `DEPLOYMENT_ENV=local-test HOSTNAME=127.0.0.1 pnpm start` kullanın. Canlıda bu istisnayı tanımlamayın.

## Mimari ve operasyon

- `src/server`: DB, şema, oturum, yetki ve kuyruk altyapısı.
- `src/modules`: paket, depolama, tarama, içerik yaşam döngüsü ve oyun erişimi.
- `src/worker`: kalıcı işler; ağ çağrıları web isteklerinden bağımsız.
- `drizzle`: sürümlenmiş SQL; üretimde `push` kullanılmaz.
- `deploy/compose.yml`: Dokploy production tanımı. [Dağıtım ve geri dönüş](docs/DEPLOYMENT.md).
- [API ve güvenlik sınırları](docs/ARCHITECTURE.md), [test/teslim kaydı](docs/VERIFICATION.md).

Gerçek canlı alan adları, SMTP ve yedekleme hedefi bu repository'ye yazılmaz. Production deployment için bunlar Dokploy ortamında tanımlanır. Canlı sunucuya dağıtım bu yerel uygulama tesliminin parçası olarak gerçekleştirilmemiştir.

Context7 MCP araçları bu oturumda erişilebilir değildi. Entegrasyonlarda kurulu paketlerin tipleri ve resmî kaynaklar kullanıldı: [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting), [Better Auth Drizzle adaptörü](https://better-auth.com/docs/adapters/drizzle), [pg-boss](https://github.com/timgit/pg-boss), [Dokploy Compose domain'leri](https://docs.dokploy.com/docs/core/docker-compose/domains). Görsel yön ve son inceleme Impeccable yönergesiyle yürütüldü; ürün bağlamı `PRODUCT.md`, tasarım kararları `DESIGN.md` içindedir.

## AI’sız bilgi çıkarımı ve müfredat

Öğretmen önce dosyayı yükler. Güvenlik taramasından sonra manifest/HTML/JSON/JS sabit metinleri bir parser sürecinde okunur; oyun kodu çalıştırılmaz. Öğretmen bilgileri kaydedebilir, düzeltebilir ve incelemeye gönderebilir. Kaynak doğrulaması ile eğitimsel onay ayrıdır. Kazanım belirtmeden yayın yapılabilir.

```sh
pnpm curriculum check ../kazanim
pnpm curriculum import ../kazanim
# Yeni ve boş bir çıktı dizini seçin. Ham kaynak PDF/HTML ve scriptler taşınmaz.
pnpm curriculum prepare ../kazanim /tmp/dijital-curriculum-transfer
```

Aktarım transaction içinde tamamlanır; aynı fingerprint tekrar aktarılırsa çoğalmaz. Yalnızca tam doğrulanmış aktarım aktif olur. `kazanim` paketi değişmez. Kaynak veri kısmi olduğundan `needs_review` ve bilinmeyen sınıf/program kapsamı korunur. 1–12 kataloğunun tamamlandığı iddia edilmez.

İsteğe bağlı `dijitalatolye.json`:

```json
{
  "schemaVersion": 1,
  "title": "Kesir mutfağı",
  "description": "Bir bütünün eşit parçalarını seçerek kesirleri keşfedin.",
  "grade": 4,
  "subject": "Matematik"
}
```

`programId` ve `outcomeCodes` isteğe bağlıdır; yalnızca gerçek katalogdaki program/kodlarla doldurulur. Mevcut `manifest.json` giriş dosyası desteği devam eder. Bu bilgiler öğretmen beyanıdır; otomatik eğitimsel onay değildir. Çıkarım limiti dosya başına 1 MiB, toplam 5 MiB, 30 saniyedir. Dosya sınırları ve tarama kuralları ayrıca uygulanır.

Ayrıntılı model, API ve dağıtım notları: [CURRICULUM.md](docs/CURRICULUM.md).

## Öğrenci, sınıf ve ödev pilotu

`STUDENT_LEARNING_ENABLED` varsayılan `false` değerindedir. Ayrı test veritabanında doğrulamadan sonra web ortamında açın. Öğrenciler kullanıcı adı/sınıf koduyla kayıt olur; öğretmen üyelikleri onaylar ve yayımlanmış oyunları ödev verir. SDK uyumlu oyunlarda cihazlar arası devam ve ödev raporları vardır. [Kurulum, API, SDK, pilot paketler ve dağıtım](docs/STUDENT-LEARNING.md).

## Teknik değerlendirme ve kapaklar

Otomatik teknik rapor ve zorunlu editör formu güvenlik, erişilebilirlik uyarıları ve eğitimsel kararları ayırır. Öğretmenin/paketin kapağı kullanılır; yoksa kayıtlı başlık, ders ve sınıftan yerel Sharp worker’ı bir bilgi kapağı hazırlar. Yüklenen oyun kodu sunucuda çalıştırılmaz. Manifest v2, API ve geçiş adımları: [TECHNICAL-REVIEW.md](docs/TECHNICAL-REVIEW.md).
