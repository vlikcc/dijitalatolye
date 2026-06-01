# DijitalAtölye

Öğretmenlerin hazırladığı HTML/ZIP tabanlı eğitici oyun, simülasyon ve interaktif içerikleri toplayan; **Guard** ile dosya güvenliği, AI destekli moderasyon ve editör onayı süreçlerinden geçirerek öğrencilere ve öğretmenlere yayınlayan **EdTech platformu**.

## Vizyon

MEB müfredatına uygun (sınıf, ders, kazanım) içerik kataloğu sunan, kalite güvencesi sağlanmış, ölçülebilir bir merkezi dijital eğitim ekosistemi.

## Mimari Genel Bakış

- **Stil:** Microservices + Event-Driven + Transactional Outbox
- **Backend:** .NET 10 + ASP.NET Core Minimal API + EF Core
- **Frontend:** Angular v21 + TypeScript + Angular Material + Tailwind CSS
- **Mesaj broker:** RabbitMQ + MassTransit
- **API Gateway:** YARP
- **Auth:** ASP.NET Core Identity + JWT (OpenIddict uyumlu yol haritası)
- **Object storage:** MinIO (S3 uyumlu)
- **Dosya güvenliği:** [Guard](https://github.com/gorkemio/guard) — ClamAV/YARA tarama, admin onayı, HMAC imzalı teslim (`ghcr.io/gorkemio/guard`)
- **LLM:** DeepSeek (birincil), Gemini + Claude (fallback)
- **Arama:** Elasticsearch
- **Prod deploy:** Docker Compose + Caddy (TLS), opsiyonel K3s/Helm
- **Observability:** OpenTelemetry, Sentry; opsiyonel Loki/Prometheus/Grafana stack

Detaylar: [`02-Sistem-Mimarisi.md`](02-Sistem-Mimarisi.md), [`docs/adr/`](docs/adr/)

## Servisler

| Servis | Sorumluluk | Port (host / `make up-full`) |
|--------|-----------|------------------------------:|
| ApiGateway | Routing, JWT, rate limit | 5000 |
| Identity | Kayıt, giriş, JWT, şifre sıfırlama | 5001 |
| User | Profil, favoriler, bildirim tercihleri | 5002 |
| Catalog | Sınıf/ders/kazanım/etiket (MEB) | 5003 |
| Storage | MinIO, presigned URL, Guard entegrasyonu | 5004 |
| Content | Yükleme, versiyonlama, AI metadata çıkarımı, durum makinesi | 5005 |
| AIModeration | Statik analiz + LLM moderasyon | 5006 |
| Review | Editör kuyruğu ve karar akışı | 5007 |
| Notification | E-posta + SignalR in-app | 5008 |
| Analytics | Görüntülenme / etkileşim metrikleri | 5109 |
| Search | Elasticsearch tam metin + facet | 5110 |
| Admin | Dashboard, audit, operasyon metrikleri | 5111 |
| Web (Angular) | SPA — prod/full stack'te nginx | 8080 (full) / 4200 (`make web`) |

**Guard alt stack** (prod/full compose ile birlikte): `guard-web`, worker'lar, Postgres, Redis, ClamAV, **nginx + React yönetim paneli** — Storage.API ile HMAC üzerinden konuşur. Lokal UI: **http://localhost:18000**

## Hızlı Başlangıç

### Gereksinimler

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) veya Podman
- [Node.js 22+](https://nodejs.org/) (frontend geliştirme için)
- [GNU Make](https://www.gnu.org/software/make/) (opsiyonel)
- **DeepSeek API key** — AI moderasyon ve içerik metadata çıkarımı için

### Seçenek A — Sadece altyapı + `dotnet run` (günlük geliştirme)

```bash
make env          # .env + COMPOSE_DEV_SECRET + JWT_SIGNING_KEY
# .env içine DEEPSEEK_API_KEY yazın

make up           # Postgres, RabbitMQ, Redis, ES, MinIO, MongoDB, Mailhog
make migrate
make build

# Ayrı terminallerde:
make run-gateway  # :5000
make run-identity # :5001
# ... diğer servisler (make help)

make web          # Angular dev server — http://localhost:4200
```

Detaylı adımlar: [`docs/getting-started.md`](docs/getting-started.md)

### Seçenek B — Tüm sistem Docker'da (dev profili)

```bash
make env
make up-full      # infra + tüm API'ler + Angular nginx — http://localhost:8080, API :5000
```

Guard stack `docker-compose.full.yml` içinde `guard.stack.yml` ile birlikte gelir; `.env` içinde `GUARD_*` secret'larını doldurun (bkz. `.env.example`).

### Seçenek C — Production self-host (Caddy + TLS)

Tek sunucuda production konfigürasyonu — Caddy 80/443, kapalı veri portları, EF auto-migrate, Guard entegrasyonu:

```bash
make prod-env       # .env.prod oluşturur, temel secret'ları üretir
# .env.prod: DEEPSEEK_API_KEY + GUARD_HMAC_SECRET, GUARD_HMAC_SECRETS, vb.

make prod-up-mail   # SMTP testi için Mailhog profili ile
# veya: make prod-up

make prod-smoke     # https://<PUBLIC_DOMAIN>/ health kontrolü
```

Lokal test: `PUBLIC_DOMAIN=localhost`, tarayıcıda self-signed sertifikayı kabul edin → **https://localhost**

Guard yönetim paneli (dosya tarama / onay): **http://localhost:18000** — ilk giriş için `docker exec -it guard-web guard-entrypoint manage createsuperuser`

Detay: [`docs/runbooks/selfhost-prod.md`](docs/runbooks/selfhost-prod.md)

### Varsayılan seed admin (Identity)

İlk migration/seed sonrası (Development veya `Database__AutoMigrate=true`):

| Alan | Değer |
|------|-------|
| E-posta | `admin@dijitalatolye.local` |
| Şifre | `Admin123!` |

Production'da bu hesabı değiştirin veya devre dışı bırakın.

### Test

```bash
make test           # unit + integration (LiveLLM hariç)
make test-llm       # gerçek DeepSeek API (DEEPSEEK_API_KEY gerekli)
make web-test       # Angular unit testleri
```

E2E: [`tests/e2e/`](tests/e2e/)

## İçerik ve güvenlik akışı (özet)

1. Öğretmen ZIP/HTML yükler → Content.API AI ile metadata önerir → MinIO'ya kaydedilir.
2. `FileUploadedV1` → Storage.API dosyayı **Guard**'a iletir (HMAC imzalı multipart).
3. Guard tarar; durum callback'leri → `GuardScanUpdatedV1` → Content durumu güncellenir.
4. Admin onayı sonrası Guard dosyayı Storage.API'ye teslim eder → MinIO → `GuardFileDeliveredV1`.
5. Paralel: AI moderasyon → editör incelemesi → yayın → Search indeksleme.

## Repo Yapısı

```
dijitalatolye/
├── src/
│   ├── ApiGateway/                 # YARP reverse proxy
│   ├── Services/                   # Mikroservisler (Identity, Content, Storage, …)
│   ├── BuildingBlocks/             # EventBus, Outbox, Auth, WebHostExtensions, …
│   └── Web/dijitalatolye-web-ng/   # Angular v21 SPA
├── tests/                          # Unit, integration, Playwright E2E
├── deploy/
│   ├── docker-compose/             # dev.yml, full.yml, prod.yml, guard.stack.yml
│   ├── helm/                       # K8s chart'ları
│   └── ansible/                    # K3s bootstrap
├── docs/                           # ADR, runbook, demo
├── scripts/                        # CI, backup, smoke
└── .github/workflows/              # CI/CD
```

## Faydalı Make komutları

```bash
make help           # Tüm komutlar
make ps / ps-full   # Container durumu
make prod-logs      # Prod log takibi
make prod-backup    # Postgres + Mongo + MinIO yedek
```

## Katkı

[`CONTRIBUTING.md`](CONTRIBUTING.md) — Conventional Commits.

## Lisans

Bu repo telif sahibi tarafından açıkça lisanslanana kadar **All Rights Reserved**'dir. Bkz. [`LICENSE`](LICENSE).
