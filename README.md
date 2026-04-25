# DijitalAtölye

Öğretmenlerin hazırladığı HTML tabanlı eğitici oyun, simülasyon ve interaktif içerikleri toplayan, AI destekli moderasyon ve editör onayı süreçlerinden geçirerek öğrencilere ve öğretmenlere yayınlayan **eğitim teknolojileri (EdTech) platformu**.

## Vizyon

MEB müfredatına uygun (sınıf, ders, kazanım) içerik kataloğu sunan, kalite güvencesi sağlanmış, ölçülebilir bir merkezi dijital eğitim ekosistemi.

## Mimari Genel Bakış

- **Stil:** Microservices + Event-Driven + CQRS (kısmi)
- **Backend:** .NET 10 + ASP.NET Core Minimal API + EF Core
- **Frontend:** React 19 + TypeScript + Vite + Tailwind + shadcn/ui
- **Mesaj Broker:** RabbitMQ + MassTransit
- **API Gateway:** YARP
- **Auth:** OpenIddict
- **LLM:** DeepSeek (primary), Gemini + Claude (fallback)
- **Cluster:** Self-hosted K3s
- **Observability:** Loki + Prometheus + Grafana + Tempo + Sentry

Detaylar için: [`02-Sistem-Mimarisi.md`](02-Sistem-Mimarisi.md), [`docs/adr/`](docs/adr/)

## Servisler

| Servis | Sorumluluk | Port (dev) |
|--------|-----------|-----------:|
| ApiGateway | Routing, JWT validation, rate limit | 5000 |
| Identity | Kimlik doğrulama, JWT, OAuth | 5001 |
| User | Profil, öğretmen doğrulama, favori | 5002 |
| Catalog | Sınıf/ders/kazanım/etiket | 5003 |
| Storage | MinIO/GCS soyutlama, presigned URL | 5004 |
| Content | İçerik yükleme, versiyonlama, durum | 5005 |
| AIModeration | Statik analiz + DeepSeek LLM | 5006 |
| Review | Editör kuyruğu ve karar akışı | 5007 |
| Notification | E-posta + in-app bildirim | 5008 |
| Search | Elasticsearch tam metin + facet | 5009 |
| Analytics | Görüntülenme/oynanma metrikleri | 5010 |

## Hızlı Başlangıç

### Gereksinimler

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) veya Podman
- [Node.js 22+](https://nodejs.org/) (frontend için)
- [Task](https://taskfile.dev/) (opsiyonel — `make` da kullanılabilir)

### Lokal Geliştirme

```bash
# Bağımlılıkları başlat (PostgreSQL, RabbitMQ, Redis, Elasticsearch, MinIO, MongoDB, ClamAV)
make up

# Migration'ları çalıştır
make migrate

# Tüm servisleri build et
make build

# Tüm testleri çalıştır
make test

# Frontend geliştirme sunucusu
make web
```

İlk çalıştırma için: [`docs/getting-started.md`](docs/getting-started.md)

### Production Self-Host (Docker Compose)

Tek sunucuda production konfigürasyonuyla çalıştırma — Caddy + otomatik TLS, kapalı veri portları, EF auto-migrate, log rotation, yedekleme:

```bash
make prod-env       # .env.prod uretir, secret'lari otomatik doldurur
make prod-up        # build + up (Caddy 80/443 public)
make prod-smoke     # https://<domain>/health/live testi
```

Detay: [`docs/runbooks/selfhost-prod.md`](docs/runbooks/selfhost-prod.md)

## Repo Yapısı

```
dijitalatolye/
├── src/
│   ├── ApiGateway/                      # YARP reverse proxy
│   ├── Services/                        # 10 mikroservis
│   │   ├── Identity/                    # Clean Architecture: API/App/Domain/Infrastructure
│   │   ├── User/
│   │   ├── Content/
│   │   ├── ...
│   ├── BuildingBlocks/                  # Ortak kütüphaneler
│   │   ├── Common/                      # Result, Error, Paging
│   │   ├── EventBus/                    # MassTransit + CloudEvents
│   │   ├── Outbox/                      # Transactional Outbox
│   │   ├── Authentication/              # JWT middleware
│   │   └── WebHostExtensions/           # Serilog + OTel + healthcheck
│   └── Web/dijitalatolye-web/           # React 19 SPA
├── tests/
│   ├── UnitTests/
│   ├── IntegrationTests/                # Testcontainers
│   └── E2ETests/                        # Playwright
├── deploy/
│   ├── docker-compose/                  # Lokal bağımlılıklar
│   ├── helm/                            # K8s deployment chart'ları
│   ├── ansible/                         # K3s cluster bootstrap
│   └── terraform/                       # Cloud kaynakları (hybrid)
├── docs/
│   └── adr/                             # Architecture Decision Records
├── scripts/
└── .github/workflows/                   # CI/CD
```

## Yol Haritası

| Faz | Süre | Çıktı |
|-----|------|-------|
| Faz 0 | 2 hafta | Foundation: repo, ADR, docker-compose, K3s, CI/CD |
| Faz 1 | 6 hafta | Çekirdek servisler + vertical slice demo |
| Faz 2 | 6 hafta | AI olgunlaşma + öğretmen/editör paneli |
| Faz 3 | 4 hafta | Search + keşif + etkileşim + SEO |
| Faz 4 | 4 hafta | Admin, audit, güvenlik, KVKK, beta |

Detaylı todo: [`03-Todo-List.md`](03-Todo-List.md)

## Katkı

[`CONTRIBUTING.md`](CONTRIBUTING.md) okuyun. Conventional Commits zorunlu.

## Lisans

Bu repo telif sahibi tarafından açıkça lisanslanana kadar **All Rights Reserved**'dir. Bkz. [`LICENSE`](LICENSE).
