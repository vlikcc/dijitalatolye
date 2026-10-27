# Dokploy, yedekleme ve geri dönüş

## Tek alan adlı ekip demosu — doa.gorkem.io

`deploy/compose.demo.yml`, repository'den web ve migration image'larını sunucuda
derler. Dokploy Git sağlayıcısında `main` ve
`./next-platform/deploy/compose.demo.yml` seçilir; domain `web:3000` servisine gider.
PostgreSQL ve uygulama verileri kalıcı volume'lardadır; public DB veya posta portu yoktur.

`DEMO_CATALOG_ENABLED=true`, `STUDENT_LEARNING_ENABLED=true` ve
`BUNDLED_DEMO_ONLY=true` bu profilde sabittir. 16 yerel demo aynı uygulama adresinde
`sandbox=allow-scripts` ile çalışır. Öğrenci kaydı, sınıflar ve üyelik onayı açıktır.
Katalog demoları mevcut ürün sözleşmesinde ödev olarak atanamaz. Dışarıdan oyun
yükleme ve yüklenmiş oyun dosyalarına erişim bu profilde kapalıdır; böylece ayrı
oyun alan adı gerektirmeden oturum izolasyonu korunur. Tam yayın hattı için alttaki
normal production profiline geçilir.

Dokploy ortamında birbirinden bağımsız rastgele `POSTGRES_PASSWORD`,
`BETTER_AUTH_SECRET`, `PREVIEW_SECRET`, `INTERNAL_SECRET`, en az 20 karakterlik
`DEMO_TEACHER_PASSWORD` ve 8–16 büyük harf/rakamdan `DEMO_CLASS_CODE` tanımlanır.
`seed-team-demo.ts` ilk kurulumda `demo@doa.gorkem.io` öğretmenini ve bir örnek
sınıfı oluşturur; tekrar dağıtım hesap veya sınıfı değiştirmez. Parolalar Git'e
veya deployment loglarına yazılmaz. Bu hesap bir demo kimliğidir; gerçek bir
kişinin e-posta doğrulaması yapılmış gibi kullanılmaz.

SMTP kurulana kadar Mailpit e-postaları yalnızca iç Docker ağında tutar; gerçek
alıcıya göndermez. Normal öğretmen kaydı için e-posta doğrulaması korunur; ekip
hazır demo öğretmeniyle girebilir. Öğrenci kaydı e-posta gerektirmez.

Tüm web yanıtlarında `X-Robots-Tag: noindex, nofollow, noarchive`, sayfalarda robots
meta etiketi ve `/robots.txt` içinde `Disallow: /` vardır. Bu indeksleme
talimatıdır; bağlantıyı bilen ziyaretçilerin erişimini engellemez.

## Dağıtım

1. İki ayrı kayıtlı kök domain ayırın: uygulama ör. `atolye.example.org`, oyunlar ör. `oyun-alani.example.net`. Oyun köküne `*.oyun-alani.example.net` DNS kaydı ve DNS challenge ile wildcard TLS sertifikası gerekir. Uygulama cookie domain'ini genişletmeyin.
2. `next-platform` build context'inden commit etiketiyle iki image üretin:

```sh
docker build --target web --build-arg GAME_BASE_DOMAIN=oyun-alani.example.net -t registry.example/dijital-web:COMMIT .
docker build --target worker -t registry.example/dijital-worker:COMMIT .
```

Web'in CSP'si **build sırasında** GAME_BASE_DOMAIN'e bağlanır. Dokploy'daki runtime GAME_BASE_DOMAIN aynı olmalı. Farklı oyun alan adı için web image'ını yeniden üretin. Secret build arg kullanmayın. Dockerfile sadece açıkça listelenen kaynakları kopyalar; `.env`, `.data`, yerel build çıktısı ve sırlar image'a girmez.

3. Dokploy'da Docker Compose uygulaması oluşturun; compose dosyası `next-platform/deploy/compose.yml`, dosya taban yolu `next-platform/deploy` olsun. `nginx.conf.template` aynı dizinde ulaşılabilir kalmalı. WEB_IMAGE ve WORKER_IMAGE commit etiketlerini, APP_URL, GAME_BASE_DOMAIN, GAME_BASE_DOMAIN_REGEX (`oyun-alani\\.example\\.net` değil, gerçek env değerinde tek ters bölü: `oyun-alani\.example\.net`), PostgreSQL parolasını, üç bağımsız secret'ı, SMTP ayarlarını tanımlayın. URL içindeki DB parolası URI-safe rastgele karakterlerden oluşmalı.
4. Dokploy Domains ile uygulama domain'ini `web:3000`, wildcard oyun domain'ini `games:8080` servisine yönlendirin. Traefik wildcard sertifika resolver'ının DNS sağlayıcı credentials'ını Dokploy secret olarak yapılandırın. Native domain UI wildcard yönlendirmeyi desteklemiyorsa Dokploy'un Traefik ayarlarında bu servise HostRegexp router ekleyin; aynı hostu birden fazla router'a yönlendirmeyin.
5. PostgreSQL healthcheck → tek seferlik migrate → web/worker sıralaması Compose'ta tanımlıdır. Migration başarısız olursa yeni uygulama başlamaz. Queue şeması migration aşamasında hazırlanır, web/worker migrate etmez.
6. İsteğe bağlı temel ders seed'ini migrate image'ıyla çalıştırın. İlk yöneticiyi kayıt + e-posta doğrulama + `bootstrap-admin` ile oluşturun; 2FA kurun.
7. Gerçek bir küçük demo paketi yükleyin; tarama, statik çıkarım, öğretmen bilgi onayı ve kazanım kaynak incelemesi, editör onayı ve wildcard oyun origin'inde JS/local fetch çalışmasını doğrulayın. Yayından kaldırınca doğrudan oyun URL'si 403 dönmeli.

Proxy'de oyun upload yoluna en az 50 MB + multipart üstbilgileri için 52 MB request limiti ve 180 saniye aktarım süresi verin; JSON/auth yollarında daha küçük limit kullanın. Web/DB/worker saatlerini NTP ile senkron tutun. ClamAV, PostgreSQL ve worker için public port eklemeyin. İlk ClamAV imza güncellemesi bitmeden temiz sonuç beklemeyin.

## Sağlık ve izleme

Web `/api/health` DB erişimini kontrol eder. Worker heartbeat DB erişimi ve süreç canlılığını gösterir; Docker healthcheck dosya yaşını izler. Bu, her işin başarılı olduğunu göstermez: yönetim ekranındaki failed işler, oldest queued job, tarama hata oranı, disk/volume doluluğu ve son başarılı backup ayrıca izlenmelidir. ClamAV imza tarihi güncel olmalı. Loglar jobId/versionId/traceId içerir; paket kaynakları, cookie, SMTP parolası ve preview token yazılmamalıdır. Oyun Nginx access log'u bu nedenle kapalıdır.

Nginx, web servisinin adresini Docker DNS üzerinden 5 saniyelik geçerlilikle yeniden çözümler; web konteynerinin IP değişimi kalıcı eski-adres hatasına dönüşmez. Yetkilendirme servisi ulaşılamazsa dosyalar verilmez. Oyun sunucusunda URL yolu imzalı önizleme yetkisi taşıdığı için request access/error log'ları kapalıdır; arıza teşhisinde web healthcheck, konteyner durumu ve kullanıcı token'ı içermeyen uygulama logları kullanılır. Yapılandırma [Nginx proxy_pass](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass) ve [resolver](https://nginx.org/en/docs/http/ngx_http_core_module.html#resolver) davranışını kullanır.

## Yedekleme

Hedef RPO 24 saat, RTO 4 saat. Bunlar canlı altyapıda restore provası yapılmadan garanti değildir.

`deploy/backup.sh`, tutarlı snapshot almak için yazan web/worker servislerini kısa süre durdurur, PostgreSQL custom dump ve dosya arşivlerini oluşturur, servisleri yeniden açar, ardından Restic ile şifreli sunucu dışı depoya gönderir. Gecelik Dokploy Scheduled Job veya sunucu zamanlayıcısı bu komutu çalıştırmalıdır. Restic repository'sini bir kez operatör oluşturur; `RESTIC_REPOSITORY`, `RESTIC_PASSWORD_FILE` ve hedef sağlayıcı credentials'ı yalnızca sunucuda tanımlanır. Script parola yazdırmaz. Staging klasörü 0700 olmalı, dump'lara yalnızca operatör erişmeli. Retention ve prune politikası operatör tarafından ayrı yapılandırılır.

```sh
DEPLOY_COMPOSE=/absolute/path/deploy/compose.yml BACKUP_STAGING=/secure/backup-staging ./deploy/backup.sh
```

Script host üzerinde Docker Compose ve `restic` ister. Günlük çalışmanın başarı kodu ve Restic snapshot tarihi izlenmelidir. Depo başka sunucuda veya sağlayıcıda olmalı; aynı disk yeterli değildir. PostgreSQL ve dosyalar tek snapshot çiftidir.

## Restore provası

Üretim volume'larına yazmadan ayrı Compose project adı ve yeni volume'lar oluşturun. Son snapshot'ı boş staging dizinine `restic restore SNAPSHOT --target /restore-test` ile indirin; arşiv sha256'larını manifestle doğrulayın. Snapshot'ın image commit'lerini kullanın. Yeni boş PostgreSQL'e `pg_restore -U app -d dijital --exit-on-error` ile dump'ı yükleyin; `content.tar` dosyasını worker'ın karantina/ready/published volume'larına ve `thumbnails.tar` dosyasını web servisinin `/data` dizinine, `thumbnails`, `curriculum-sources` ve `cover-inputs` volume’ları bağlıyken açın. Arşiv bu üç dizini birlikte içerir; hepsini tek thumbnail volume’una çıkartmayın. Dosya owner'ı image'daki node kullanıcısı (UID 1000), karantina dosyaları 0600 olmalı.

Migration'ı yeniden çalıştırın, web/worker'ı başlatın. Katalog, giriş, taranmış preview, yayımlı oyunun hash'leri, local fetch, yeni yükleme ve editör kararını kontrol edin. Restore sırasında yarım kalmış işler expire olduktan sonra pg-boss tarafından tekrar alınır. Geçici test domain'lerine göre web CSP image'ını doğru build arg ile üretin. Restore süresini ölçüp kaydedin; canlı kesintiye geçmeden önce hedef RTO ile karşılaştırın.

## Sürüm geri dönüşü

Yeni migration'lar önceki uygulama sürümüyle uyumlu (expand/contract) olmalı. Veri silen migration eklemeden önce ayrı bakım/geri dönüş planı gerekir. Uygulama hatasında WEB_IMAGE ve WORKER_IMAGE'i önceki commit'e döndürün; otomatik down migration çalıştırmayın. DB uyumsuzsa yeni boş volume'lara son tutarlı yedeği geri yükleyip doğruladıktan sonra domain yönünü değiştirin. Son başarılı backup sonrası veri kaybı RPO sınırındadır; karar operatöre aittir.

Müfredat güncellemesinde [CURRICULUM.md](CURRICULUM.md) geçiş adımlarını izleyin. `thumbnails.tar` artık `curriculum-sources` özel kaynak önbelleğini de içerir; geri yüklemede web servisinin ilgili üç volume’u bağlı olmalıdır.

Kapak sürümü geçişi: [TECHNICAL-REVIEW.md](TECHNICAL-REVIEW.md). `thumbnails.tar` içindeki `cover-inputs` da geri yüklenmelidir; web ve worker `cover_inputs` ile `thumbnails` volume’larını paylaşır. Ham kapak girdilerine Nginx erişmez.
