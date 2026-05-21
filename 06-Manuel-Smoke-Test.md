# Manuel Smoke Test — Angular Cutover Sonrası Doğrulama

Bu doküman, Faz 1-5 sonrası canlıya almadan önce çalıştırılacak el ile test akışlarını
ve Lighthouse koşum talimatını içerir. Otomasyon: [Playwright spec'leri](tests/e2e/specs/).

## 0) Ön Hazırlık

```bash
# Backend mikroservislerini ve frontend'i Docker compose ile başlat
make up-full

# DeepSeek API key'i .env'de set edili olmalı; aksi halde AI extract endpoint
# manifest title fallback'ine düşer (test edilebilir ama AI önerisi gelmez).
echo "AiExtraction__DeepSeek__ApiKey=sk-..." >> .env
```

Açık olmasını beklediğimiz portlar:
- **Frontend (Angular):** http://localhost:8080
- **Gateway (YARP):** http://localhost:5000
- **Catalog:** http://localhost:5004
- **Content:** http://localhost:5005
- **MinIO:** http://localhost:9001 (admin: `dijitalatolye` / `dijitalatolye`)

## 1) Anonim / Public Sayfalar (10 dk)

| # | Yol | Beklenen |
|---|---|---|
| 1.1 | `/` | Hero + features + adımlar + CTA görünür, console hatasız |
| 1.2 | `/about` | Misyon/vizyon/değerler grid'i 4 kart ile dolu |
| 1.3 | `/discover` | Sol filtre paneli + grid, "Yükleniyor…" geçici, sonuçlar gelir |
| 1.4 | `/discover?q=matematik` | URL query persist eder, sonuçlar filtrelenir |
| 1.5 | `/discover` → bir karta tıkla → `/contents/:slug` | Detay sayfası açılır, "Oyna" butonu görünür |
| 1.6 | `/play/:slug` | Sandbox iframe açılır, içerik render olur |
| 1.7 | `/kvkk` | İki kart (export + anonymize) görünür |
| 1.8 | `/login`, `/register`, `/forgot-password`, `/reset-password?token=x&email=y`, `/verify-email?token=x&email=y` | Tüm auth formları render olur |
| 1.9 | `/nonexistent` | 404 sayfası "Sayfa bulunamadı" |
| 1.10 | `/collections` (giriş yapmadan) | Login'e yönlendirir, `returnUrl` query string'inde tutulur |

## 2) Kayıt + Giriş (5 dk)

| # | Adım | Beklenen |
|---|---|---|
| 2.1 | `/register` → `teacher1@meb.k12.tr` + `Test1234!` + "Test Öğretmen" | "Hesap oluşturuluyor..." → `/login?registered=1` |
| 2.2 | `/login` aynı bilgilerle | Token alınır, role'ye göre yönlendirme: Teacher → `/teacher/contents/new` |
| 2.3 | Sayfa yenile | localStorage'dan token okunur, oturum kalır |
| 2.4 | Çıkış (sağ üst menü) → tekrar `/teacher/contents` | `/login`'e yönlendirir |
| 2.5 | F12 → Application → localStorage | `dijitalatolye-auth` key'i var |

## 3) Teacher Akışı (15 dk) — Faz 4 ana hedef

| # | Adım | Beklenen |
|---|---|---|
| 3.1 | `/teacher/dashboard` | 3 stat kartı (Yayında / İncelemede / Taslak) görünür |
| 3.2 | `/teacher/contents/new` | Dropzone görünür, drag-over rengi değişir |
| 3.3 | Bir ZIP dosyası sürükle-bırak | "AI içeriği analiz ediyor…" progress bar, 5-30 sn |
| 3.4 | Form fazı açılır | Title/Subject/Grade alanları AI değerleriyle dolu; her alanın yanında **AI Önerisi** rozeti (mor) |
| 3.5 | Title alanını değiştir | Rozet **Manuel** (gri) olur |
| 3.6 | Outcome chip'lerini incele | Catalog autocomplete: yeni kazanım yazınca öneri açılır; bir tane ekle/sil |
| 3.7 | Etiket ekle | Enter ya da virgül ile chip oluşur |
| 3.8 | "Kaydet ve İncelemeye Gönder" | Sıralı 3 API çağrısı: POST /contents, POST /versions, POST /submit |
| 3.9 | `/teacher/contents`'e yönlendir | Yeni içerik **Gönderildi** durumunda en üstte |
| 3.10 | Dashboard'a dön | İncelemede sayacı +1 |
| 3.11 | `/teacher/profile` → Görünen ad/Okul/Hakkında doldur → Kaydet | "Kaydedildi ✓" yazısı çıkar |
| 3.12 | F12 → Network → POST /ai-extract isteğini incele | Status 200, response body'de `metadata.confidence` ve `candidateOutcomeCount` görünür |

**Hata senaryoları:**
- PDF dosya sürükle → "Sadece .zip, .html veya .htm yüklenebilir."
- 60 MB ZIP → "Dosya 50 MB sınırını aşıyor."
- DeepSeek API key yanlış → form yine açılır ama tüm alanlar boş, sadece `metadata.title` manifest'ten gelir, console'da error log

## 4) Editor Akışı (10 dk)

Önkoşul: bir Admin hesabıyla `/admin/users` üzerinden test öğretmenini **Editör** rolüne yükselt.

| # | Adım | Beklenen |
|---|---|---|
| 4.1 | `/editor` | 4 KPI (Beklemede/Bugün incelenen/Onaylanan/Reddedilen) |
| 4.2 | `/editor/queue` | Az önce gönderilen içerik kuyrukta (5 sn refetch) |
| 4.3 | Bir öğeye tıkla → `/editor/review/:id` | AI raporu (skor + flag/uyarı listeleri) + sandbox iframe |
| 4.4 | "Onayla" butonuna bas | `/editor/queue`'a döner, kuyruktan kalkar |
| 4.5 | `/editor/history` | Karar geçmişinde "Onaylandı" rozetiyle görünür |

## 5) Admin Akışı (15 dk)

| # | Adım | Beklenen |
|---|---|---|
| 5.1 | `/admin` | 6 KPI kartı + 6 quick-link |
| 5.2 | `/admin/contents` | Tüm içeriklerin tablosu |
| 5.3 | `/admin/users` | Liste, search input, role filter dropdown |
| 5.3a | Bir öğretmen satırında "Editör Yap" | Confirm → satır yenilenir, "Editor" badge eklenir |
| 5.3b | "Editör Yetkisini Al" | Confirm → badge kaldırılır |
| 5.4 | `/admin/catalog` | Sınıf listesi (12) + Ders listesi |
| 5.5 | `/admin/audit` | Audit log tablosu, severity filtresi, sayfalama (Önceki/Sonraki) |
| 5.6 | `/admin/ai` | LLM sağlayıcı + pipeline durum kartları |
| 5.7 | `/admin/reports` | 4 KPI + içerik üretim trend placeholder + en aktif öğretmenler |

## 6) Cross-Cutting (10 dk)

| # | Konu | Beklenen |
|---|---|---|
| 6.1 | `/notifications` (giriş yaparak) | 15 sn'de bir auto-refresh; okundu işaretleme çalışır |
| 6.2 | Network tab'da bir 401 simüle et (token'ı düzenle) | Interceptor `/auth/refresh` çağırır, yeni token ile retry |
| 6.3 | Refresh de 401 verirse | Otomatik logout, `/login`'e yönlendirme |
| 6.4 | Mobile viewport (DevTools 375px) | Layout bozulmaz; nav scrollable, kartlar tek sütun |
| 6.5 | Console hatası | 0 — kırmızı error/warning olmamalı |
| 6.6 | Klavyeyle navigation (Tab) | Focus ring (`outline: 2px solid #9a5cff`) görünür |

## 7) Lighthouse Koşumu (5 dk)

```bash
# Chrome DevTools → Lighthouse → "Analyze page load"
# Aşağıdaki sayfalar için "Performance, Accessibility, Best Practices, SEO" hedef ≥ 90
```

| Sayfa | Perf | A11y | BP | SEO |
|---|---|---|---|---|
| `/` | ≥90 | ≥90 | ≥90 | ≥90 |
| `/discover` | ≥85 | ≥90 | ≥90 | ≥90 |
| `/login` | ≥90 | ≥90 | ≥90 | ≥90 |
| `/teacher/contents/new` | ≥80 | ≥90 | ≥90 | n/a (auth) |

CLI alternatif:
```bash
npx lighthouse http://localhost:8080/ --view --preset=desktop
```

## 8) AI Extract Metrik Dashboard'u (Prometheus / Grafana)

Faz 6.2'de eklenen meter: `DijitalAtolye.Content.AiExtraction`.

Metrikler:
- `ai_extract.latency` (Histogram, ms) — p95 hedefi: < 15.000 ms
- `ai_extract.requests` (Counter) — status=success/client_error/server_error etiketi
- `ai_extract.confidence` (Histogram, 0-1) — ortalama hedefi: > 0.6
- `ai_extract.candidate_outcomes` (Histogram) — Catalog'un döndüğü kazanım sayısı

PromQL örnekleri:
```promql
# p95 latency (son 5 dk)
histogram_quantile(0.95, rate(ai_extract_latency_bucket[5m]))

# Hata oranı
sum(rate(ai_extract_requests_total{status!="success"}[5m]))
  / sum(rate(ai_extract_requests_total[5m]))

# Ortalama confidence
rate(ai_extract_confidence_sum[10m]) / rate(ai_extract_confidence_count[10m])
```

## 9) Çıkış Kriterleri

Aşağıdaki maddelerin TÜMÜ yeşil olmadan canlıya alma yapılmaz:

- [ ] Bölüm 1-6 manuel adımları sıfır hata ile tamamlandı
- [ ] Lighthouse hedef skorları tutuyor
- [ ] `dotnet test tests/UnitTests/Content.AiExtraction.Tests` → tüm yeşil
- [ ] `npm test` (Angular Karma) → tüm yeşil
- [ ] `E2E_RUN_UPLOAD=1 npx playwright test specs/ai-upload.spec.ts` → yeşil
- [ ] AI extract endpoint p95 latency staging'de < 15 sn
- [ ] Console'da 0 error/warning

## 10) Rollback Planı

Cutover sonrası kritik regresyon olursa:

```bash
# Önceki React image'ına dön (image registry'de etiketli kalır)
docker compose -f deploy/docker-compose/docker-compose.prod.yml \
  -e IMAGE_TAG=v0.9-react down web && \
  IMAGE_TAG=v0.9-react docker compose ... up -d web

# Veya: Helm release rollback
helm rollback dijitalatolye-web 1 -n dijitalatolye
```

Eski React kodu git history'de `pre-angular-cutover` tag'i altında saklanır.
