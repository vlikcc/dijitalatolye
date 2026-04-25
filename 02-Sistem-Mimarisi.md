# DijitalAtölye — Sistem Mimarisi

**Doküman Versiyonu:** 1.0
**Hazırlayan:** Veli Keçeci
**Tarih:** Nisan 2026
**Mimari Stil:** Microservices + Event-Driven + CQRS (kısmi)

---

## 1. Mimari Genel Bakış

DijitalAtölye, **bağımsız olarak deploy edilebilen mikroservislerden** oluşan, **API Gateway** üzerinden dış dünyaya tek noktadan açılan, servisler arası **asenkron event-driven** iletişim kullanan bir sistemdir.

### 1.1 Mimari Prensipler
- **Database per Service:** Her servisin kendi veritabanı vardır (PostgreSQL, MongoDB veya Elasticsearch — gereksinime göre).
- **API Gateway Pattern:** Dış istekler tek noktadan girer (YARP veya Ocelot ile .NET tabanlı).
- **Event-Driven:** Servisler birbirini doğrudan çağırmak yerine event yayınlar (RabbitMQ veya Kafka).
- **Saga Pattern:** Çoklu servisi etkileyen işlemler (örn. içerik onay süreci) saga ile koordine edilir.
- **CQRS (kısmi):** Yazma (komut) ve okuma (sorgu) modelleri ayrılır; arama için Elasticsearch projeksiyonu kullanılır.
- **Outbox Pattern:** Veri tutarlılığı için event yayınları transactional outbox ile garanti altına alınır.
- **Circuit Breaker / Retry:** Polly ile dayanıklılık.
- **Observability First:** Her servis loglar, metrikler ve trace yayınlar.

---

## 2. Yüksek Seviye Mimari Diyagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    İSTEMCİLER (Clients)                          │
│  React Web (Öğretmen/Öğrenci)  •  Editör Paneli  •  Admin Panel │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
                         ▼
                ┌────────────────┐
                │   CDN + WAF    │  (Cloudflare / GCP)
                └────────┬───────┘
                         ▼
                ┌────────────────┐
                │  API Gateway   │  (YARP, .NET 10)
                │   - Auth       │
                │   - Rate Limit │
                │   - Routing    │
                └────────┬───────┘
                         │
   ┌─────────────────────┼─────────────────────────────────┐
   │                     │                                  │
   ▼                     ▼                                  ▼
┌─────────┐  ┌────────────────────┐         ┌────────────────────┐
│Identity │  │  User Service      │         │  Content Service   │
│Service  │  │  (profil, rol)     │         │  (yükleme, meta)   │
│(Auth)   │  └────────────────────┘         └─────────┬──────────┘
└─────────┘                                            │
                                                       │ events
   ┌───────────────────────┬───────────────────────────┴──────┐
   │                       │                                   │
   ▼                       ▼                                   ▼
┌────────────────┐  ┌──────────────────┐         ┌────────────────────┐
│Catalog Service │  │ AI Moderation    │         │ Storage Service    │
│(sınıf/kazanım) │  │ Service (Agent)  │         │ (MinIO/GCS gateway)│
└────────────────┘  └────────┬─────────┘         └────────────────────┘
                             │
                             ▼
                  ┌────────────────────┐
                  │  Review Service    │
                  │  (editör akışı)    │
                  └────────┬───────────┘
                           │ events
   ┌───────────────────────┼─────────────────────────────────┐
   │                       │                                  │
   ▼                       ▼                                  ▼
┌────────────────┐  ┌──────────────────┐         ┌────────────────────┐
│Search Service  │  │ Notification     │         │ Analytics Service  │
│(Elasticsearch) │  │ Service          │         │                    │
└────────────────┘  └──────────────────┘         └────────────────────┘

           ┌──────────────────────────────────────┐
           │       MESSAGE BROKER (RabbitMQ)      │
           └──────────────────────────────────────┘

           ┌──────────────────────────────────────┐
           │       CACHE (Redis Cluster)          │
           └──────────────────────────────────────┘

           ┌──────────────────────────────────────┐
           │  OBSERVABILITY: Loki + Prometheus +  │
           │  Grafana + Jaeger + Sentry           │
           └──────────────────────────────────────┘
```

---

## 3. Mikroservisler

### 3.1 Identity Service
**Sorumluluk:** Kimlik doğrulama, JWT üretimi, refresh token yönetimi, OAuth provider entegrasyonları.
- **Teknoloji:** .NET 10, ASP.NET Identity + IdentityServer/Duende veya OpenIddict
- **Veritabanı:** PostgreSQL (kullanıcı, rol, claim, refresh token)
- **API:** `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/oauth/{provider}`
- **Events:** `UserRegistered`, `UserEmailConfirmed`

### 3.2 User Service
**Sorumluluk:** Kullanıcı profili, öğretmen bilgileri (branş, okul, il), rol detayları, takip/favori.
- **Teknoloji:** .NET 10 Minimal API + EF Core
- **Veritabanı:** PostgreSQL
- **Events:** `UserProfileUpdated`, `TeacherVerified`

### 3.3 Content Service
**Sorumluluk:** İçerik yükleme, meta veri yönetimi, versiyonlama, durum yönetimi (Draft → Submitted → AIReviewed → EditorReview → Published / Rejected).
- **Teknoloji:** .NET 10 + EF Core
- **Veritabanı:** PostgreSQL (içerik metadata, versiyonlar, durum geçişleri)
- **Object Storage:** MinIO / GCS — HTML, ZIP, statik asset dosyaları için
- **API:** `/contents` (POST/GET), `/contents/{id}/versions`, `/contents/{id}/submit`
- **Events Published:** `ContentSubmitted`, `ContentVersionCreated`, `ContentPublished`, `ContentRejected`
- **Events Consumed:** `AIModerationCompleted`, `EditorDecisionMade`

### 3.4 Catalog Service
**Sorumluluk:** Sınıf, ders, ünite, kazanım hiyerarşisi; etiket ve kategoriler.
- **Teknoloji:** .NET 10 + EF Core
- **Veritabanı:** PostgreSQL
- **Cache:** Redis (kazanım ağacı çok okunup az değişir → ağır cache)
- **API:** `/catalog/grades`, `/catalog/subjects`, `/catalog/outcomes`, `/catalog/tags`
- **Admin işlemleri:** kazanım içe aktarma (JSON), etiket onay/red

### 3.5 AI Moderation Service (Agent)
**Sorumluluk:** Yüklenen içeriğin teknik ve pedagojik analizi; moderasyon raporu üretimi.
- **Teknoloji:** .NET 10 (orchestrator) + Python sidecar (statik analiz için isteğe bağlı)
- **Veritabanı:** MongoDB (esnek rapor şeması) veya PostgreSQL JSONB
- **LLM Entegrasyonu:** Soyutlama katmanı — Gemini, Claude, DeepSeek, OpenAI
- **Akış:**
  1. `ContentSubmitted` event'i tüketilir.
  2. ZIP açılır, dosyalar geçici çalışma alanına çıkarılır.
  3. **Statik analiz aşaması** (hızlı, ucuz):
     - HTML/JS parser ile AST analizi (Jint veya esprima.NET)
     - Yasaklı API kullanımı (eval, document.write, dış scriptler)
     - CSP politikası kontrolü
     - Antivirüs taraması (ClamAV)
  4. **LLM analiz aşaması** (statikten geçenler için):
     - Manifest + HTML görsel önizleme + içerik metni LLM'e gönderilir
     - Yapılandırılmış JSON yanıtı (skor, bayraklar, kazanım uyumu)
  5. Karar üretilir, `AIModerationCompleted` event'i yayınlanır.
- **Events Published:** `AIModerationCompleted` (rapor + karar)

### 3.6 Review Service (Editör Akışı)
**Sorumluluk:** Editör kuyruğu, atama, inceleme kararı, revizyon istekleri.
- **Teknoloji:** .NET 10 + EF Core
- **Veritabanı:** PostgreSQL
- **API:** `/review/queue`, `/review/{id}/assign`, `/review/{id}/decision`
- **Events Published:** `EditorDecisionMade` (Approved / Rejected / RevisionRequested)
- **Events Consumed:** `AIModerationCompleted`

### 3.7 Search Service
**Sorumluluk:** Tam metin arama, faceted filtreleme, öneri.
- **Teknoloji:** .NET 10 + Elasticsearch.NET (NEST)
- **Veritabanı:** Elasticsearch (içerik projeksiyonu)
- **API:** `/search?q=...&grade=5&subject=math&tags=puzzle`
- **Events Consumed:** `ContentPublished`, `ContentUpdated`, `ContentDeleted` → indeks güncelleme

### 3.8 Notification Service
**Sorumluluk:** E-posta, uygulama içi bildirim, web push.
- **Teknoloji:** .NET 10 + MassTransit + SendGrid/SMTP
- **Veritabanı:** PostgreSQL (bildirim geçmişi, kullanıcı tercihleri)
- **Events Consumed:** `ContentSubmitted`, `EditorDecisionMade`, `ContentPublished`, `UserRegistered`

### 3.9 Analytics Service
**Sorumluluk:** Görüntülenme, oynanma, etkileşim metrikleri toplama ve raporlama.
- **Teknoloji:** .NET 10 (event collector) + ClickHouse veya TimescaleDB
- **Eventler:** UI'dan gelen `content.viewed`, `content.played`, `content.completed` vb.
- **API:** `/analytics/content/{id}`, `/analytics/teacher/{id}/dashboard`

### 3.10 Storage Service (Wrapper)
**Sorumluluk:** Object storage (MinIO/GCS) için soyutlama; presigned URL üretimi, virüs taraması.
- **Teknoloji:** .NET 10 + MinIO SDK / Google.Cloud.Storage
- Antivirüs tarama tetikleme (ClamAV worker)

---

## 4. API Gateway

**Teknoloji:** YARP (Yet Another Reverse Proxy) — Microsoft destekli, .NET 10 ile uyumlu, modern reverse proxy.

**Sorumluluklar:**
- Routing (path-based ve header-based)
- JWT validation (Identity Service public key ile)
- Rate limiting (token bucket, IP + user bazlı)
- Request/response logging
- CORS yönetimi
- BFF (Backend for Frontend) pattern — gerekirse istemci özel agregasyonlar

---

## 5. Frontend Mimarisi

### 5.1 Genel
- **Framework:** React 19 + TypeScript
- **Build:** Vite
- **State Management:** TanStack Query (server state) + Zustand (client state)
- **Routing:** React Router 7
- **UI Kit:** Tailwind CSS + shadcn/ui (özelleştirilmiş tema)
- **Forms:** React Hook Form + Zod
- **i18n:** i18next (Türkçe varsayılan)

### 5.2 Uygulama Yapısı
Üç ayrı SPA olarak değil, **rol bazlı route'lar ile tek bir React uygulaması** önerilir (paylaşılan bileşenler ve auth state için):
- `/` — Genel keşif, içerik tüketimi
- `/play/:slug` — İçerik oynatma (sandboxed iframe)
- `/teacher/*` — Öğretmen paneli (yükleme, içeriklerim)
- `/editor/*` — Editör paneli (kuyruk, inceleme)
- `/admin/*` — Yönetim paneli

### 5.3 İçerik Oynatma (Sandboxed Iframe)
```html
<iframe
  src="https://content-cdn.dijitalatolye.tr/{contentId}/{version}/index.html"
  sandbox="allow-scripts allow-forms allow-pointer-lock"
  csp="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  referrerpolicy="no-referrer"
  allow="autoplay; fullscreen"
></iframe>
```
> `allow-same-origin` **verilmez** → içerik üst pencereye erişemez, localStorage izole edilir.

---

## 6. Veri Stratejisi

### 6.1 Veritabanı Seçimleri
| Servis | DB | Gerekçe |
|--------|----|---------|
| Identity, User, Catalog, Content, Review, Notification | PostgreSQL 17 | İlişkisel, tutarlılık öncelikli |
| AI Moderation | MongoDB veya PostgreSQL JSONB | Esnek/sürekli değişen rapor şeması |
| Search | Elasticsearch 9 | Tam metin + faceted arama |
| Analytics | ClickHouse veya TimescaleDB | Yüksek hacimli zaman serisi |
| Cache | Redis 7 | Oturum, kazanım ağacı, rate limit |
| Object Storage | MinIO (self-hosted) veya GCS | İçerik dosyaları, varlıklar |

### 6.2 Tutarlılık Modeli
- Servis içi: Strong consistency (ACID)
- Servisler arası: Eventual consistency (event-driven, outbox pattern)

### 6.3 Migration
- EF Core Migrations (her servis kendi DbContext'i ile)
- DbUp veya Flyway alternatif olarak değerlendirilebilir

---

## 7. İletişim Modelleri

### 7.1 Senkron (HTTP)
- API Gateway → Servisler (REST + JSON)
- Servisler arası **mecbur** kalmadıkça doğrudan HTTP çağrısı yapılmaz; gerektiğinde gRPC ile (örn. Identity → diğer servisler için kullanıcı doğrulama)

### 7.2 Asenkron (Event)
- **Broker:** RabbitMQ (V1) — Kafka opsiyonu V2'de değerlendirilebilir
- **Library:** MassTransit (.NET için olgun, saga ve outbox desteği)
- **Event Schema:** CloudEvents 1.0 spesifikasyonu
- **Schema Registry:** Schema versiyonlama için klasör bazlı + CI doğrulaması

### 7.3 Saga Örneği — İçerik Yayınlama Saga'sı
```
1. ContentSubmitted (Content Service)
2. → AI Moderation Service: rapor üret
3. → AIModerationCompleted
4. → Review Service: editör kuyruğuna ekle
5. → Editor decision: Approved / Rejected
6. → EditorDecisionMade
7. → Content Service: durumu Published'a çevir
8. → Search Service: indeksle
9. → Notification Service: öğretmene bildir
```

---

## 8. Güvenlik Mimarisi

| Katman | Önlem |
|--------|-------|
| Edge | Cloudflare WAF, DDoS koruması, bot mitigation |
| Gateway | JWT validation, rate limiting, CORS |
| Servis | mTLS (servisler arası), authorization policy'leri |
| Veri | Kimlik bilgileri Vault / Secret Manager'da, DB encryption at rest |
| İçerik | Sandboxed iframe + sıkı CSP + antivirüs |
| Audit | Tüm admin/editör aksiyonları audit log'a yazılır |

---

## 9. Deployment ve DevOps

### 9.1 Konteynerleştirme
- Docker (her servis için Dockerfile, multi-stage build)
- Docker Compose (lokal geliştirme)

### 9.2 Orkestrasyon
- **Önerilen:** Kubernetes (GKE veya self-hosted)
- **Alternatif (V1 hızlı başlangıç için):** Google Cloud Run (mevcut Yargısalzeka deneyiminle uyumlu)

### 9.3 CI/CD
- **CI:** GitHub Actions
  - Lint, unit test, integration test, container build
  - SAST (SonarQube veya CodeQL)
  - Container security scan (Trivy)
- **CD:** ArgoCD (GitOps) veya GitHub Actions → Cloud Run/K8s

### 9.4 Ortamlar
- `local` (Docker Compose)
- `dev` (her PR için ephemeral environment, opsiyonel)
- `staging` (production benzeri, test verisi)
- `production`

### 9.5 IaC
- **Terraform** — bulut kaynakları
- **Helm Charts** — Kubernetes deployments

---

## 10. Gözlemlenebilirlik

| Pillar | Araç |
|--------|------|
| Loglama | Serilog → Loki (veya Elasticsearch) → Grafana |
| Metrikler | OpenTelemetry → Prometheus → Grafana |
| Tracing | OpenTelemetry → Jaeger / Tempo |
| Hata izleme | Sentry |
| Uptime | Better Stack veya UptimeRobot |
| Dashboard | Grafana (her servis için altın sinyaller) |

**Altın sinyaller (her servis için):** İstek hızı, hata oranı, latency p50/p95/p99, kaynak doygunluğu.

---

## 11. Klasör / Repo Yapısı

**Mono-repo önerisi (V1 için yönetimi kolay):**

```
dijitalatolye/
├── src/
│   ├── ApiGateway/
│   ├── Services/
│   │   ├── Identity/
│   │   │   ├── Identity.API/
│   │   │   ├── Identity.Application/
│   │   │   ├── Identity.Domain/
│   │   │   └── Identity.Infrastructure/
│   │   ├── User/
│   │   ├── Content/
│   │   ├── Catalog/
│   │   ├── AIModeration/
│   │   ├── Review/
│   │   ├── Search/
│   │   ├── Notification/
│   │   ├── Analytics/
│   │   └── Storage/
│   ├── BuildingBlocks/
│   │   ├── EventBus/
│   │   ├── Common/
│   │   └── WebHostExtensions/
│   └── Web/
│       ├── dijitalatolye-web/  (React)
│       └── shared-ui/
├── tests/
│   ├── UnitTests/
│   ├── IntegrationTests/
│   └── E2ETests/  (Playwright)
├── deploy/
│   ├── helm/
│   ├── terraform/
│   └── docker-compose/
├── docs/
└── .github/workflows/
```

> İleride hızlı büyüme olursa servis bazlı poly-repo'ya geçiş kolay olacaktır.

---

## 12. Teknoloji Stack Özeti

| Katman | Teknoloji |
|--------|-----------|
| Backend Framework | .NET 10 (ASP.NET Core, Minimal API) |
| ORM | Entity Framework Core 10 |
| Auth | OpenIddict / Duende IdentityServer |
| Message Broker | RabbitMQ + MassTransit |
| Cache | Redis |
| Search | Elasticsearch |
| Object Storage | MinIO / Google Cloud Storage |
| Database | PostgreSQL, MongoDB, ClickHouse |
| API Gateway | YARP |
| Frontend | React 19 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui |
| LLM | Gemini / Claude / DeepSeek (soyutlama ile) |
| Container | Docker + Kubernetes / Cloud Run |
| CI/CD | GitHub Actions + ArgoCD |
| IaC | Terraform + Helm |
| Observability | OpenTelemetry + Grafana stack + Sentry |
| Testing | xUnit, FluentAssertions, Testcontainers, Playwright |
