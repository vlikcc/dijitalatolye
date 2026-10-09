# Self-hosted Production Deployment (Docker Compose)

Tek sunucuda DijitalAtölye platformunu production konfigürasyonuyla çalıştırma kılavuzu. Aynı stack lokalde de aynen çalışır — önce lokalde test edin, sonra gerçek sunucuya geçin.

## Önkoşullar

- Linux sunucu (Ubuntu 22.04+ veya Debian 12 önerilir) — minimum **8 vCPU / 16 GB RAM / 100 GB SSD**
- Docker Engine **24+** ve Docker Compose **v2+**
- Açık portlar: **80**, **443** (UDP 443 HTTP/3 için)
- Bir alan adı: `dijitalatolye.example.com` → sunucu IP'si (A/AAAA kayıtları)
- (Opsiyonel) DeepSeek / Gemini / Anthropic API anahtarları

Lokal test için: yalnızca Docker Desktop + 8 GB ayrılmış bellek yeterli.

## Hızlı Başlangıç

```bash
# 1) Secret'lar ve ortam değişkenleri
make prod-env
# .env.prod dosyası oluştu, parolalar otomatik üretildi (chmod 600).
# Şimdi .env.prod'u açın:
#   - PUBLIC_DOMAIN  (lokal test: 'localhost' kalsın)
#   - DEEPSEEK_API_KEY (zorunlu — AI moderasyon için)
#   - GOOGLE_OAUTH_CLIENT_ID / SECRET (opsiyonel)
#   - SMTP_* (lokalde mailhog profili kullanılabilir)

# 2) Build + ayağa kaldır
make prod-up
# (Lokal SMTP testi için MailHog ile)
make prod-up-mail

# 3) Smoke test
make prod-smoke

# 4) Logları izle
make prod-logs

# 5) Yedek al
make prod-backup
```

## Nasıl Çalışıyor

```
                ┌─────────────────────────────────────────────┐
   Internet ──> │  Caddy (80/443, otomatik TLS)               │
                │  └─ /api/*  → gateway:8080  (YARP, JWT)    │
                │  └─ /hubs/* → gateway:8080  (SignalR/WS)   │
                │  └─ /cdn/*  → minio:9000    (yayın CDN)    │
                │  └─ /       → web:8080      (React SPA)    │
                └─────────────────────────────────────────────┘
                                 │ internal docker network
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
         identity, user, catalog, content, review,
         storage, notification, search, analytics,
         aimoderation, admin   (her biri 8080 internal)
              │                  │                  │
              ▼                  ▼                  ▼
        postgres   mongodb   redis   rabbitmq   minio   elasticsearch   clamav
        (sadece 127.0.0.1'a bind — backup/debug için)
```

### Public yüzey
- **Yalnızca Caddy** (80/443) dış ağa açık.
- Tüm uygulama servisleri docker iç ağında — host'ta port yok.
- Veri servisleri (Postgres/Mongo/...) `127.0.0.1` adresinde — sadece host içinden erişilir, dış ağa kapalı.

### TLS
- `ACME_EMAIL` **zorunludur** (boşsa compose başlamaz).
- `PUBLIC_DOMAIN=localhost` ise Caddy e-postaya bakmadan **internal CA** ile self-signed sertifika verir (lokal test için `ACME_EMAIL=admin@localhost.test` gibi herhangi bir değer yeterli); tarayıcı uyarısını "Advanced → Proceed" ile geçin.
- Gerçek alan adı için `PUBLIC_DOMAIN=dijitalatolye.example.com`, `ACME_EMAIL=gercek-adres@alanadi.com`. Caddy otomatik Let's Encrypt aktive eder.

### Yönetim panelleri (public değil)
- MinIO konsolu ve Guard paneli yalnızca `127.0.0.1`'e bağlıdır. Uzaktan SSH tüneli kullanın:
  `ssh -L 9001:127.0.0.1:9001 -L 18000:127.0.0.1:18000 <sunucu>` → `http://localhost:9001`, `http://localhost:18000`
- `/cdn/*` yalnızca yayınlanan içerik bucket'ına (`MINIO_BUCKET_PUBLISHED`) GET/HEAD izin verir.

### Migration & seed
Servisler başlarken `Database__AutoMigrate=true` ortam değişkeni gördüğünde EF Core migration'larını (`MigrateDatabaseAsync`) ve ardından seed işlemlerini kendileri çalıştırır. Manuel `dotnet ef` adımı **gerekmez**.

- Her context migration geçmişini kendi şemasında tutar (`identity."__EFMigrationsHistory"`, `audit."__EFMigrationsHistory"`, …); `audit` DB'sini paylaşan Admin ve Audit context'leri çakışmaz.
- Migration sırasında context başına bir Postgres advisory lock alınır; aynı DB'ye bağlanan replikalar/servisler (ör. Identity ve Admin'in ikisi de audit'i migrate eder) sırayla çalışır.
- **Eski kurulumlar (migration öncesi, `EnsureCreated` ile yaratılmış DB'ler):** geçmiş tablosu yok ama tablolar varsa servis DB'yi *legacy* sayar ve tek transaction içinde: servise özgü eski ALTER/backfill SQL'ini çalıştırır (`Persistence/*LegacySchema.cs`), `InitialCreate`'te olup eksik olan tablo/index'leri yaratır, tüm kolonları doğrular ve `InitialCreate`'i uygulanmış olarak işaretler (baseline). Eksik kolon varsa baseline yapılmaz, transaction geri alınır ve servis açılmaz — log'da eksik kolonlar listelenir. Bu dönüşüm DB başına yalnızca bir kez olur; loglarda `legacy DB ... baseline'lanıyor` / `baseline tamam` satırlarını görürsünüz.
- İlk migration'lı sürümü deploy etmeden **önce** `make prod-backup` alın.

## Yedekleme

```bash
make prod-backup   # ./backups/<tarih>/ altına yazar
```

Cron önerisi (sunucuda):
```cron
0 3 * * * cd /opt/dijitalatolye && BACKUP_DIR=/var/backups/dijitalatolye RETAIN_DAYS=30 make prod-backup >> /var/log/da-backup.log 2>&1
```

Yedek içerikleri: tüm Postgres veritabanları (custom format), Guard Postgres (`guard-pg.dump`), Mongo `ai_moderation` (gzip archive), tüm MinIO bucket'ları (`minio.tar.gz`) ve Guard veri volume'u (`guard-data.tar.gz`). Herhangi bir adım başarısız olursa script hata koduyla çıkar (cron logunu izleyin). 14 günden eski yedekler otomatik silinir (`RETAIN_DAYS` ile değiştirilebilir).

### Geri Yükleme
```bash
./scripts/prod-restore.sh backups/<ts>
# 'evet' onayı ister; uygulama + Guard servislerini durdurur, Postgres (ana + Guard),
# Mongo, MinIO ve guard-data'yı geri yükler, sonra servisleri yeniden başlatır.
#   SKIP_MINIO=1  -> MinIO adımını atla
#   ASSUME_YES=1  -> onay sorma (otomasyon; DİKKAT)
```
Not: MinIO geri yüklemesi `mc mirror --overwrite` kullanır; yedekte olmayan mevcut nesneler silinmez. Geri yüklemeyi düzenli olarak ayrı bir test host'unda deneyin.

## Gözlemlenebilirlik (opsiyonel profil)

Prometheus, Grafana ve OTLP collector:

```bash
docker compose -f deploy/docker-compose/docker-compose.prod.yml \
  -f deploy/docker-compose/docker-compose.observability.yml \
  --env-file .env.prod --profile observability up -d
```

`.env.prod` içinde:
- `SENTRY_DSN` — hata izleme (önerilir)
- `OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317` — trace/metric export
- `GRAFANA_ADMIN_PASSWORD` — Grafana UI (http://127.0.0.1:3000)

Servisler `/metrics` endpoint'i üzerinden Prometheus ile scrape edilir.

## Yaygın Operasyonlar

```bash
make prod-ps                       # durum
make prod-logs                     # canlı log
make prod-rebuild SVC=identity     # tek servisi yeniden build
make prod-down                     # durdur (veriler kalır)
make prod-nuke                     # TÜM verileri sil (onaylı)
```

## Sorun Giderme

| Belirti | Bakılacak yer |
|---|---|
| `make prod-up` "POSTGRES_PASSWORD is required" | `.env.prod` içinde secret'lar boş — `make prod-env` tekrar koşun |
| Tarayıcı `NET::ERR_CERT_AUTHORITY_INVALID` (lokalde) | Beklenen: Caddy local CA. Continue'a basın |
| Identity 503 / migrate hatası | `docker compose ... logs identity` — Postgres `healthy` mi? |
| AI moderation cevap vermiyor | `.env.prod`'da `DEEPSEEK_API_KEY` boş olabilir |
| 502 / SignalR kopma | Caddy log + gateway log: cluster destination hostname'leri (`identity:8080`) çözülüyor mu |
| ClamAV 5 dakika boyunca unhealthy | Normal: virüs imza veritabanı ilk indirme (start_period: 5m) |

## Lokal'den Üretime Geçiş Kontrol Listesi

- [ ] `PUBLIC_DOMAIN` gerçek alan adına çekildi
- [ ] `ACME_EMAIL` gerçek e-postaya çekildi (Let's Encrypt iletişim)
- [ ] `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (>= 12 karakter) ilk kurulum için dolduruldu; admin oluştuktan ve şifre değiştirildikten sonra boşaltıldı
- [ ] `IMAGE_TAG` sabit bir sürüme (`latest` değil) çekildi
- [ ] Geri yükleme (`scripts/prod-restore.sh`) test host'unda denendi
- [ ] `CORS_ORIGINS` sadece üretim alan adı (virgülle birden fazla)
- [ ] `SMTP_*` gerçek e-posta sağlayıcısına yönlendirildi (mailhog profili **kullanılmadı**)
- [ ] `DEEPSEEK_API_KEY` üretim anahtarı
- [ ] `GOOGLE_OAUTH_CLIENT_ID/SECRET` üretim Google Cloud projesinden
- [ ] Sunucuda firewall (ufw) sadece 22, 80, 443 açık
- [ ] `.env.prod` `chmod 600`, sunucuda `/opt/dijitalatolye/` altında, repo'ya commit edilmedi
- [ ] Cron yedek kurulu, hedef yedek dizini farklı bir disk/host
- [ ] Sentry DSN aktif (opsiyonel)
- [ ] DNS A/AAAA kaydı doğru, `dig` ile doğrulandı

## Bilinen Sınırlar (Self-host Compose)

- **Tek host** — yatay ölçek yok. Hızla büyüme bekliyorsanız [Helm/K3s](../deploy/helm/) yoluna geçin.
- **HA yok** — sunucu düşerse hizmet düşer. Kritikse aktif/pasif ikinci host + replication kurun.
- **Storage** lokal disk üzerinde — disk dolma riski (özellikle MinIO + ClamAV); izleyin.
- **OpenTelemetry/Loki/Tempo entegrasyonları opsiyonel** — `OTEL_EXPORTER_OTLP_ENDPOINT` boş bırakılırsa devre dışı.
