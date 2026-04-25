# DijitalAtölye — Detaylı Todo List

**Doküman Versiyonu:** 1.0
**Hazırlayan:** Veli Keçeci
**Tarih:** Nisan 2026
**Toplam Tahmini Süre:** ~22 hafta (5–6 ay) — tek geliştirici varsayımıyla agresif tempo

> Her görev için tahmini süre verilmiştir. Görevler [ ] olarak işaretlenmiştir; tamamlandıkça [x] yapılabilir.

---

## FAZ 0 — HAZIRLIK VE ALTYAPI (Hafta 1–2)

### 0.1 Proje Kurulumu
- [ ] GitHub organizasyonu / private repo oluştur (`dijitalatolye/dijitalatolye`)
- [ ] Branch stratejisi belirle (trunk-based veya GitFlow)
- [ ] PR template, issue template, CODEOWNERS dosyaları
- [ ] README, CONTRIBUTING, LICENSE
- [ ] `.editorconfig`, `.gitignore`, `.gitattributes`
- [ ] Conventional Commits + commit lint kuralları

### 0.2 Mimari Kararlar (ADR)
- [ ] ADR-001: Mikroservis sınırları
- [ ] ADR-002: Mesaj broker seçimi (RabbitMQ vs Kafka)
- [ ] ADR-003: API Gateway seçimi (YARP)
- [ ] ADR-004: Auth stratejisi (OpenIddict vs Duende)
- [ ] ADR-005: Database per service ve seçimler
- [ ] ADR-006: LLM sağlayıcı soyutlama katmanı
- [ ] ADR-007: Mono-repo vs poly-repo
- [ ] ADR-008: Cloud sağlayıcı (GCP — Yargısalzeka uyumu için)

### 0.3 Geliştirme Ortamı
- [ ] .NET 10 SDK kurulum dokümanı
- [ ] Docker Desktop / Podman kurulum
- [ ] Lokal `docker-compose.yml` (PostgreSQL, RabbitMQ, Redis, Elasticsearch, MinIO, ClamAV)
- [ ] `Makefile` / `taskfile` (komut sadeleştirmesi)
- [ ] Pre-commit hooks (lint, format, secret scanning — gitleaks)
- [ ] VSCode + Cursor önerilen eklenti listesi

### 0.4 CI/CD İskeleti
- [ ] GitHub Actions workflow: PR'da build + test
- [ ] Container build pipeline (multi-stage Dockerfile şablonu)
- [ ] Container registry seçimi (GHCR / GAR)
- [ ] SonarQube veya CodeQL entegrasyonu
- [ ] Trivy ile container security scan
- [ ] Dependabot / Renovate ayarları

### 0.5 Bulut Altyapısı (Terraform)
- [ ] GCP projesi oluştur (`dijitalatolye-prod`, `dijitalatolye-staging`)
- [ ] Terraform state backend (GCS bucket + state lock)
- [ ] VPC, subnet, firewall kuralları
- [ ] Cloud SQL (PostgreSQL) instance
- [ ] Memorystore (Redis)
- [ ] GCS buckets (içerik storage, statik asset, terraform state, backup)
- [ ] Artifact Registry
- [ ] Secret Manager
- [ ] (V2) GKE cluster veya Cloud Run servisleri

### 0.6 Gözlemlenebilirlik İskeleti
- [ ] Grafana Cloud veya self-hosted Grafana stack kurulumu
- [ ] Loki, Prometheus, Tempo
- [ ] Sentry hesabı ve proje
- [ ] Uptime monitoring (Better Stack)

---

## FAZ 1 — ÇEKİRDEK SERVİSLER (Hafta 3–8)

### 1.1 Building Blocks (Ortak Kütüphaneler)
- [ ] `BuildingBlocks.Common` — Result pattern, hata yapıları, paging modelleri
- [ ] `BuildingBlocks.EventBus` — MassTransit soyutlaması, event kontratları
- [ ] `BuildingBlocks.WebHostExtensions` — Serilog, OpenTelemetry, healthcheck, swagger setup
- [ ] `BuildingBlocks.Authentication` — JWT validation middleware
- [ ] `BuildingBlocks.Outbox` — Outbox pattern uygulaması (EF Core ile)
- [ ] Unit testler

### 1.2 Identity Service
- [ ] Proje iskeleti (Clean Architecture: API / Application / Domain / Infrastructure)
- [ ] PostgreSQL + EF Core + Migrations
- [ ] Kullanıcı, Rol, Claim, RefreshToken entity'leri
- [ ] OpenIddict konfigürasyonu (password flow + refresh token flow)
- [ ] `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- [ ] E-posta doğrulama (token üretimi, e-posta gönderme — Notification Service event'iyle)
- [ ] Şifre sıfırlama
- [ ] 2FA (TOTP — opsiyonel, admin için zorunlu)
- [ ] Google OAuth provider
- [ ] Rate limiting (login için brute-force koruması)
- [ ] Unit + integration testler (Testcontainers ile gerçek PostgreSQL)
- [ ] Dockerfile + healthcheck endpoint
- [ ] OpenAPI / Swagger dokümanı

### 1.3 User Service
- [ ] Proje iskeleti
- [ ] Profil entity'si (TeacherProfile, EditorProfile, AdminProfile)
- [ ] `UserRegistered` event handler → User Service'te profil oluştur
- [ ] `/users/me`, `/users/{id}/profile`
- [ ] Öğretmen doğrulama akışı (MEB e-postası kontrolü veya manuel)
- [ ] Avatar upload (Storage Service'e proxy)
- [ ] Favori/koleksiyon CRUD
- [ ] Testler + Dockerfile

### 1.4 Catalog Service
- [ ] Proje iskeleti
- [ ] Entity'ler: Grade, Subject, Unit, Outcome, Tag, Category
- [ ] MEB kazanım JSON içe aktarma scripti (admin endpoint)
- [ ] CRUD API'leri
- [ ] Redis cache (kazanım ağacı, kategoriler)
- [ ] Etiket onay akışı (yeni etiket ilk eklendiğinde "pending" → admin onaylar)
- [ ] Public read endpoint'ler (hiyerarşik kazanım ağacı, etiket listesi)
- [ ] Testler + Dockerfile

### 1.5 Storage Service
- [ ] Proje iskeleti
- [ ] MinIO / GCS soyutlaması
- [ ] Presigned URL üretimi (upload + download)
- [ ] ZIP açma utility (geçici çalışma alanı yönetimi)
- [ ] Antivirüs tarama (ClamAV worker — Docker container)
- [ ] Dosya boyutu / tür / sayı validasyonları
- [ ] Testler

### 1.6 API Gateway (YARP)
- [ ] YARP projesi
- [ ] Routing konfigürasyonu (Identity, User, Catalog için)
- [ ] JWT validation middleware
- [ ] CORS politikası
- [ ] Rate limiting (Microsoft.AspNetCore.RateLimiting)
- [ ] Healthcheck aggregator
- [ ] Swagger UI agregasyonu (her servisin swagger.json'ını birleştirme)

### 1.7 Frontend İskeleti
- [ ] Vite + React 19 + TypeScript projesi
- [ ] Tailwind + shadcn/ui kurulum
- [ ] Tema (renkler, tipografi — DijitalAtölye marka kimliği)
- [ ] React Router 7 + layout'lar (PublicLayout, TeacherLayout, EditorLayout, AdminLayout)
- [ ] TanStack Query setup
- [ ] Auth context (login/logout/refresh akışı)
- [ ] i18n (i18next + Türkçe locale)
- [ ] Form sistemi (React Hook Form + Zod)
- [ ] API client (axios/ky + interceptor — auto refresh token)
- [ ] Login, Register, Forgot Password sayfaları
- [ ] Profil sayfası
- [ ] 404, error boundary, loading state'ler
- [ ] Storybook (paylaşılan komponentler için)

---

## FAZ 2 — İÇERİK YÖNETİMİ VE AI MODERASYON (Hafta 9–14)

### 2.1 Content Service
- [ ] Proje iskeleti
- [ ] Entity'ler: Content, ContentVersion, ContentMetadata, ContentStatus, RejectionReason
- [ ] State machine: Draft → Submitted → AIReviewing → AIReviewed → EditorReviewing → Approved → Published / Rejected / RevisionRequested
- [ ] `/contents` POST (presigned upload URL döner) + meta veri kaydı
- [ ] `/contents/{id}/submit` — Outbox'a `ContentSubmitted` event'i yazar
- [ ] Versiyonlama mantığı
- [ ] Manifest.json validasyonu (zorunlu alanlar: entry, title, author, version)
- [ ] `/contents/me` (öğretmenin kendi içerikleri)
- [ ] `/contents/{id}` GET (durum + metadata + AI raporu özet)
- [ ] Outbox dispatcher background service
- [ ] `AIModerationCompleted` ve `EditorDecisionMade` event handler'ları → durum güncelle
- [ ] Testler + Dockerfile

### 2.2 AI Moderation Service
- [ ] Proje iskeleti
- [ ] LLM Provider soyutlaması (`ILlmProvider` arayüzü)
  - [ ] GeminiProvider implementasyonu
  - [ ] ClaudeProvider implementasyonu
  - [ ] DeepSeekProvider implementasyonu
- [ ] Konfigürasyon ile aktif sağlayıcı seçimi
- [ ] **Statik analiz pipeline'ı:**
  - [ ] ZIP açma + dosya envanter çıkarma
  - [ ] HTML parse (AngleSharp)
  - [ ] JS analiz (Jint ile AST veya regex tabanlı yasaklı pattern tespiti)
  - [ ] Yasaklı API listesi: `eval`, `Function()`, `document.write`, `innerHTML` (kritiklik), `localStorage` (uyarı)
  - [ ] Dış kaynak (script src, link href, fetch URL) whitelist kontrolü
  - [ ] CSP politikası önerisi üret
  - [ ] Antivirüs taraması tetikle (Storage Service)
- [ ] **LLM analiz pipeline'ı:**
  - [ ] Prompt şablonu (Türkçe, yapılandırılmış JSON çıktı isteyen)
  - [ ] Kazanım metnini Catalog Service'ten çek
  - [ ] HTML render edilip ekran görüntüsü alınması (Playwright headless) — opsiyonel ama önerilir
  - [ ] LLM çağrısı + retry + cache
  - [ ] JSON parse + validation (FluentValidation)
- [ ] **Karar verme:**
  - [ ] Statik bayrak ağırlıkları
  - [ ] LLM skor + statik bayrak → final skor + karar
  - [ ] Karar matrisi (AutoApprove / NeedsReview / Flagged / AutoReject)
- [ ] Rapor MongoDB'ye kayıt
- [ ] `AIModerationCompleted` event yayınlama
- [ ] Tüketim worker'ı (`ContentSubmitted` event'i)
- [ ] Maliyet logging (her LLM çağrısının token sayısı + maliyet)
- [ ] Manuel "yeniden analiz" endpoint'i (admin için)
- [ ] Testler (mock LLM provider)

### 2.3 Review Service (Editör Akışı)
- [ ] Proje iskeleti
- [ ] Entity'ler: ReviewItem, EditorAssignment, EditorDecision, RevisionRequest
- [ ] `AIModerationCompleted` event handler → kuyruğa ekle
- [ ] Önceliklendirme algoritması (skor + bekleme süresi)
- [ ] `/review/queue` GET (filtre + sayfalama)
- [ ] `/review/{id}` GET (içerik + AI raporu birleşik)
- [ ] `/review/{id}/assign` (atama veya self-assign)
- [ ] `/review/{id}/decision` POST (Approved / Rejected / RevisionRequested + yorum)
- [ ] `EditorDecisionMade` event yayınlama
- [ ] Editör performans metrikleri toplama
- [ ] Testler

### 2.4 Notification Service
- [ ] Proje iskeleti
- [ ] E-posta sağlayıcı soyutlama (SMTP, SendGrid, AWS SES)
- [ ] Şablon sistemi (HTML template + değişkenler — Razor ya da Handlebars.NET)
- [ ] Event handler'lar:
  - [ ] `UserRegistered` → hoş geldin + e-posta doğrulama
  - [ ] `ContentSubmitted` → öğretmene "alındı" bildirimi
  - [ ] `EditorDecisionMade` → öğretmene karar bildirimi
  - [ ] `ContentPublished` → öğretmene "yayında" bildirimi
- [ ] Uygulama içi bildirim (DB + WebSocket / SignalR push)
- [ ] Kullanıcı bildirim tercihleri
- [ ] Testler

### 2.5 Frontend — Öğretmen Paneli
- [ ] `/teacher/dashboard` — özet (içerik sayısı, durum dağılımı, son aktivite)
- [ ] `/teacher/contents/new` — Çok adımlı yükleme formu
  - [ ] Adım 1: Dosya yükleme (drag & drop, ZIP veya HTML)
  - [ ] Adım 2: Metadata (sınıf, ders, ünite, kazanım — kaskadlı seçimler)
  - [ ] Adım 3: Etiketler + açıklama + kapak görseli
  - [ ] Adım 4: Önizleme + gönder
- [ ] `/teacher/contents` — İçerik listesi (durum filtresi, arama)
- [ ] `/teacher/contents/:id` — Detay sayfası (durum geçmişi, AI raporu özeti, editör yorumu, revize butonu)
- [ ] Bildirim merkezi (üst bar)

### 2.6 Frontend — Editör Paneli
- [ ] `/editor/queue` — Kuyruk (öncelik, filtre, atama)
- [ ] `/editor/review/:id` — İnceleme ekranı:
  - [ ] Sol: sandboxed iframe ile içerik önizleme
  - [ ] Sağ üst: AI raporu (skor, bayraklar, kazanım uyumu)
  - [ ] Sağ alt: Karar formu (onay/red/revizyon + yorum)
- [ ] Klavye kısayolları (a=approve, r=reject, etc.)
- [ ] `/editor/dashboard` — Editör performans

---

## FAZ 3 — YAYIN, ARAMA VE KEŞİF (Hafta 15–18)

### 3.1 Search Service
- [ ] Proje iskeleti
- [ ] Elasticsearch index mapping (Türkçe analyzer, faceted alanlar)
- [ ] `ContentPublished` event handler → indeksle
- [ ] `ContentUpdated`, `ContentUnpublished` handler'lar
- [ ] Tam metin arama API'si
- [ ] Faceted arama (sınıf, ders, kazanım, etiket, yazar, süre, zorluk)
- [ ] Sıralama seçenekleri
- [ ] Önerilen içerikler (more_like_this query)
- [ ] Reindex endpoint (admin)
- [ ] Testler

### 3.2 Analytics Service (Temel)
- [ ] Proje iskeleti
- [ ] Event collector endpoint (`/track`)
- [ ] ClickHouse veya TimescaleDB setup
- [ ] Batch insert worker
- [ ] Temel metrikler API'si:
  - [ ] İçerik için: görüntülenme, oynanma, ortalama oyun süresi, beğeni
  - [ ] Öğretmen için: toplam görüntülenme, en popüler içerik
- [ ] (V2) Daha gelişmiş raporlar

### 3.3 Frontend — Genel Keşif
- [ ] `/` — Ana sayfa (öne çıkanlar, kategoriler, haftanın içerikleri)
- [ ] `/discover` — Keşif sayfası (faceted filtreler + arama)
- [ ] `/contents/:slug` — İçerik detay sayfası
  - [ ] Kapak, başlık, yazar, kazanım, etiketler
  - [ ] "Oyna" butonu (yeni sayfada veya modal)
  - [ ] Beğeni, favori, paylaş, embed kodu, QR
  - [ ] Yorum bölümü
- [ ] `/play/:slug` — Tam ekran oynatma (sandboxed iframe + telemetri)
- [ ] Kazanım/etiket/ders kategori sayfaları

### 3.4 Frontend — Etkileşim
- [ ] Beğeni butonu + optimistik update
- [ ] Favorilere ekleme
- [ ] Koleksiyon oluşturma (öğretmen için)
- [ ] Yorum ekleme (login gerekli)
- [ ] Sosyal paylaşım (Twitter, Facebook, WhatsApp, kopyala)
- [ ] QR kod modal'ı
- [ ] Embed kodu (iframe snippet) modal'ı

### 3.5 SEO ve Performans
- [ ] React Helmet ile meta tag yönetimi
- [ ] Sitemap.xml otomatik üretim
- [ ] robots.txt
- [ ] OpenGraph / Twitter Card meta'ları
- [ ] Lighthouse skor hedefi: > 90
- [ ] Image optimization (lazy loading, responsive images)
- [ ] Code splitting / route-based lazy load
- [ ] CDN konfigürasyonu (statik asset + içerik dosyaları)

---

## FAZ 4 — YÖNETİM, GÜVENLİK VE BETA (Hafta 19–22)

### 4.1 Admin Paneli
- [ ] `/admin/users` — Kullanıcı listesi, rol atama, ban
- [ ] `/admin/catalog` — Kazanım ağacı CRUD + JSON içe aktarma
- [ ] `/admin/tags` — Etiket yönetimi (onay/red, birleştirme)
- [ ] `/admin/contents` — Tüm içerikleri yönetme (gerekirse manuel kaldırma)
- [ ] `/admin/editors` — Editör atama, performans
- [ ] `/admin/dashboard` — Platform genel raporları
- [ ] `/admin/audit-log` — Audit trail görüntüleme
- [ ] `/admin/ai-config` — LLM sağlayıcı ve threshold ayarları

### 4.2 Audit Logging
- [ ] Her servis için audit middleware (kim, ne zaman, hangi aksiyon)
- [ ] Merkezi audit log topic'i (RabbitMQ)
- [ ] Audit log servisi (PostgreSQL veya Elasticsearch)

### 4.3 Güvenlik Sıkılaştırma
- [ ] OWASP ZAP otomatik tarama (CI'da scheduled)
- [ ] Penetration test (3. taraf — bütçe izin verirse)
- [ ] Secret scanning (gitleaks, trufflehog)
- [ ] SAST raporlarının triajı
- [ ] Rate limiting değerlerinin gerçek trafikle ayarlanması
- [ ] CSP başlıklarının final hali
- [ ] CORS politikalarının gözden geçirilmesi
- [ ] mTLS — servisler arası (K8s'de)
- [ ] Backup ve restore prosedürlerinin test edilmesi

### 4.4 KVKK / Hukuki
- [ ] Gizlilik politikası
- [ ] Kullanım şartları
- [ ] Çerez politikası + cookie banner
- [ ] Veri silme talebi süreci (kullanıcı hesabını silme)
- [ ] Veri taşınabilirliği (kullanıcı verilerini export)
- [ ] Telif hakkı politikası (içerik üreticisinin hakları)

### 4.5 Test Stratejisi
- [ ] Unit test coverage > %70 hedefi
- [ ] Integration test (Testcontainers ile)
- [ ] Contract test (Pact — opsiyonel)
- [ ] E2E test (Playwright — kritik akışlar):
  - [ ] Kayıt → giriş → içerik yükle → AI → editör onayı → yayın
  - [ ] Keşif → arama → oynatma
- [ ] Load test (k6) — hedef: 1000 eşzamanlı kullanıcı
- [ ] Stress test (AI moderation throughput)

### 4.6 Dokümantasyon
- [ ] Geliştirici dokümantasyonu (her servis için README)
- [ ] API dokümantasyonu (Swagger + Redoc)
- [ ] Mimari dokümantasyon (C4 modeli — context, container, component diyagramları)
- [ ] Operasyon kılavuzu (runbook'lar — yaygın sorunlar ve çözümleri)
- [ ] Onboarding kılavuzu (yeni geliştirici için)

### 4.7 Beta Lansmanı
- [ ] Kapalı beta için 30–50 öğretmen davet et
- [ ] Geri bildirim formu / Hotjar entegrasyonu
- [ ] Beta süresince haftalık geri bildirim toplantısı
- [ ] Bug triajı ve hızlı iterasyon
- [ ] Performans izleme (gerçek trafik altında)
- [ ] AI moderasyon doğruluğunu ölç (editör red oranı)
- [ ] AI threshold'larını ayarla

---

## FAZ 5 — PUBLIC LANSMAN (Hafta 23–24)

### 5.1 Lansman Hazırlığı
- [ ] Production ortam stress test
- [ ] DNS, SSL sertifikaları (Let's Encrypt veya managed)
- [ ] CDN cache prewarm
- [ ] Status page (statuspage.io veya self-hosted)
- [ ] On-call rotasyonu / alarm kuralları
- [ ] Incident response playbook
- [ ] Sosyal medya hesapları
- [ ] Tanıtım videosu / landing page
- [ ] Press kit
- [ ] MEB / Bakanlık ile koordinasyon (varsa)

### 5.2 Lansman Sonrası (Hafta 1–4)
- [ ] Günlük metrik incelemeleri
- [ ] Hızlı bug fix sprintleri
- [ ] Kullanıcı geri bildirim toplantıları
- [ ] İlk içerik kampanyası (ödüllü içerik üretim yarışması)
- [ ] Eğitim webinarları (öğretmenler için içerik üretme rehberi)

---

## FAZ 6 — V2 ve İleri Yol Haritası (Lansman sonrası)

### 6.1 V2 Özellikleri
- [ ] Mobil native uygulama (React Native veya Flutter)
- [ ] Google Classroom / Microsoft Teams entegrasyonu
- [ ] LMS özellikleri (sınıf yönetimi, ödev atama, ilerleme takibi)
- [ ] AI ile içerik **üretme** asistanı (öğretmenlere şablon ve kod yardımı)
- [ ] Çoklu dil desteği (İngilizce başta)
- [ ] Multi-tenant (okul/il bazlı kapanlı topluluklar)

### 6.2 Teknik İyileştirmeler
- [ ] Kafka geçişi (event hacmi artarsa)
- [ ] Service mesh (Istio veya Linkerd)
- [ ] Feature flag sistemi (Unleash veya LaunchDarkly)
- [ ] A/B testing altyapısı
- [ ] ML tabanlı öneri motoru (collaborative filtering)
- [ ] Daha akıllı AI moderasyon (fine-tuned model)

---

## EK — Görev Yönetimi Önerileri

### Araç önerileri
- **Issue tracking:** GitHub Issues + Projects (mono-repo için ideal)
- **Sprint planlama:** 2 haftalık sprintler
- **Daily:** Async (kendi kendine) — Notion veya GitHub discussions

### Etiketler
- `type:feature`, `type:bug`, `type:tech-debt`, `type:docs`
- `service:identity`, `service:content`, `service:ai-moderation`, vb.
- `priority:p0` (blocker), `p1`, `p2`, `p3`
- `effort:S`, `effort:M`, `effort:L`, `effort:XL`

### Risk takibi
Risklerin haftalık gözden geçirilmesi (PRD bölüm 9'daki tablo güncel tutulmalı):
- AI moderasyon doğruluğu
- LLM maliyetleri
- Editör kapasitesi
- Güvenlik olayları

### Tek başına geliştirme stratejisi
Veli, bu projeyi muhtemelen başlangıçta tek başına geliştireceksin. Önerilerim:
1. **Önce vertical slice:** Identity → Content → AI Moderation (basit) → Frontend yükleme akışı = end-to-end "tek bir içerik yayınlandı" demosu. Bu ~6 hafta yeterli olur.
2. **AI'ı mock'la:** İlk haftalarda AI Moderation Service'i sahte kararlar dönecek şekilde stub yap; gerçek LLM entegrasyonunu Faz 2'ye bırak.
3. **Cloud Run'la başla:** Yargısalzeka deneyiminden tanıdığın Cloud Run, Kubernetes'ten çok daha hızlı başlangıç sağlar. Ölçek arttığında GKE'ye geçebilirsin.
4. **Cursor + Claude Code'u maksimum kullan:** Building blocks ve CRUD servisler için tekrarlayan kod büyük ölçüde AI ile üretilebilir.
5. **Erken kullanıcıyla doğrula:** Faz 1 sonunda 5 öğretmenle dahili bir alpha yap. Mimariye yatırım yapmadan önce ürünün gerçekten kullanılacak olduğundan emin ol.
