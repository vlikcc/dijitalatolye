# Plan: Angular v21 Rewrite + AI Destekli Sade İçerik Yükleme

## Context

DijitalAtölye platformunda iki büyük değişiklik yapılacak:

1. **Frontend rewrite:** Mevcut React 19 + Vite SPA (`src/Web/dijitalatolye-web/`) tamamen kaldırılacak, yerine **Angular v21 + Angular Material + Tailwind CSS** ile sıfırdan yazılacak. Hard cutover — paralel deploy yok, 33 sayfa tek seferde portlanacak.

2. **İçerik yükleme akışı sadeleşecek:** Bugün öğretmen `TeacherUploadWizard.tsx`'de 4 adımda (metadata → file → preview → submit) tüm alanları (başlık, konu, sınıf, süre, kazanım, etiket, zorluk vb.) **elle** doldurmak zorunda. Yeni akışta:
   - Kullanıcı **tek ekranda** ZIP/HTML bundle'ı yükler.
   - Backend yeni bir endpoint (`POST /contents/ai-extract`) bundle içeriğini parse eder (HTML/text), DeepSeek LLM'e gönderir, **başlık, açıklama, konu, sınıf, süre (dk), kazanım kodları, etiketler, zorluk** alanlarını döner.
   - Kazanım kodları için LLM'e prompt'ta `Catalog.API`'den çekilen MEB kazanım listesi (konu+sınıf filtresi ile) verilir → halüsinasyon engellenir.
   - Kullanıcı AI'nin doldurduğu formu **inline editleyebilir**, sonra "Kaydet ve Gönder" der.
   - Akış **senkron**: upload → 5-30 sn loading → form dolu görünür (DeepSeek hızlı, ZIP-only kapsam küçük).

İstenen sonuç: öğretmen yükleme süresi 5+ dk'dan <1 dk'ya iner; metadata kalitesi (özellikle kazanım eşleştirme) artar.

---

## Karar Özeti (Kullanıcı Onaylı)

| Konu | Karar |
|---|---|
| Angular sürümü | **v21 (latest)** |
| UI kütüphanesi | **Angular Material + Tailwind CSS** |
| AI destekli yüklemede desteklenen format | **Sadece ZIP/HTML eğitim bundle'ı** (PDF/video/docx kapsam dışı) |
| AI akış zamanlaması | **Senkron** (request-response) |
| Geçiş stratejisi | **Hard cutover** — React tamamen silinir |
| Port kapsamı | **33 sayfa tek seferde** |
| Kazanım kaynağı | **Catalog.API'den filtrelenmiş liste LLM prompt'una eklenir** |

---

## Mimari Değişiklikler

### Yeni / Değişen Backend

1. **`Content.API`** — yeni endpoint:
   - `POST /contents/ai-extract` (multipart/form-data, max 50 MB)
     - Akış: ZIP'i geçici dizine açar → HTML/text dosyalarını okur (zip-slip koruması mevcut `Bundles/BundleExtractor.cs` mantığını yeniden kullan) → Catalog.API'den olası kazanımları çeker → DeepSeek'e structured-output prompt yollar → `AiExtractedMetadataDto` döner.
     - Bu endpoint **draft içerik oluşturmaz**, sadece öneri döner. Kullanıcı formu onaylayıp "Kaydet" deyince mevcut `POST /contents` + `POST /contents/{id}/versions` + `POST /contents/{id}/submit` zinciri çalışır.
   - DTO:
     ```csharp
     public sealed record AiExtractedMetadataDto(
       string? Title, string? Description, string? Subject,
       int? GradeLevel, int? DurationMinutes, string? Difficulty,
       List<string> OutcomeCodes, List<string> Tags,
       double Confidence, string? RawModelResponse);
     ```

2. **Yeni klasör `Content.API/AiExtraction/`**:
   - `IContentMetadataExtractor.cs` — interface.
   - `DeepSeekMetadataExtractor.cs` — `AIModeration.API/Llm/DeepSeekProvider.cs` ile aynı yapılandırmayı (endpoint, API key, model) kullanır. JSON-mode forced.
   - `BundleTextSampler.cs` — ZIP'ten ilk N HTML dosyasının `<body>` text'ini, başlık/heading'leri çıkarır (HtmlAgilityPack — mevcut Directory.Packages.props'a ekle). Token sınırı için ~8K karakter kırpar.
   - `CatalogOutcomeProvider.cs` — `Catalog.API`'den `subject` + `gradeLevel`'a göre kazanım kodlarını çeker (yeni Catalog endpoint: `GET /catalog/outcomes?subject=X&grade=Y` — mevcut endpoint yoksa eklenir).

3. **`Catalog.API`** — kazanım listesi endpoint'i:
   - `src/Services/Catalog/Catalog.API/Endpoints/CatalogEndpoints.cs` içine `GET /catalog/outcomes?subject=&grade=` ekle. Mevcut Catalog domain'ini incele; outcome tablosu yoksa seed gerekli.

4. **`Directory.Packages.props`** güncelleme:
   - `HtmlAgilityPack` (HTML parse) eklenecek.

### Yeni Frontend (`src/Web/dijitalatolye-web-ng/`)

- **Toolchain:** Angular CLI v21, standalone components (NgModule yok), Signals + RxJS, Angular Router, HttpClient + interceptor, Angular Material v21, Tailwind v3.4 (Material ile coexistence için preflight kapatılır).
- **Auth:** `auth.store.ts` (Signals-based, mevcut Zustand davranışını taklit) + `authInterceptor` (Bearer token, 401 → refresh). `localStorage` key adı `dijitalatolye-auth` korunur (sessions kırılmasın).
- **API client:** Tek `ApiService` (HttpClient sarmalayıcı), baseURL `/api`. Mevcut React'taki [api.ts](src/Web/dijitalatolye-web/src/lib/api.ts) kontratını birebir taşır.
- **i18n:** `@ngx-translate/core` (TR/EN, mevcut JSON'lar [locales](src/Web/dijitalatolye-web/src/locales) reuse edilir).
- **Forms:** Angular Reactive Forms + custom Zod-benzeri validator paketi (`@ngneat/transloco-validators` yerine basit class-based validators).
- **State:** Component-scoped Signals; cross-cutting state için RxJS BehaviorSubject (Zustand benzeri).
- **Data fetching:** `@ngneat/query` (React Query'nin Angular karşılığı) — mevcut staleTime/refetch davranışı korunur.
- **SEO:** Angular `Meta`/`Title` servisleri + SSR (Angular Universal v21) — şart değilse Faz 2'ye atılabilir.
- **Klasör yapısı:**
  ```
  src/app/
    core/         (auth, api, interceptors, guards)
    shared/       (UI components, pipes, directives)
    layouts/      (PublicLayout, AppLayout)
    features/
      auth/       (login, register, forgot-password, reset-password, verify-email)
      public/     (home, about, discover, content-detail, collections)
      teacher/    (dashboard, upload-simple, my-contents, profile)
      editor/     (dashboard, queue, review, history)
      admin/      (dashboard, contents, users, catalog, ai-config, audit, reports)
  ```

### Yeni `TeacherUploadSimplePage` (Angular)

Tek ekran akışı:
1. **Dropzone** (Angular Material drag-drop + `<input type="file">` fallback). Tek dosya, ZIP/HTML, max 50 MB.
2. Dosya seçildiğinde otomatik `POST /contents/ai-extract` (multipart). Material `mat-progress-bar` + "AI içeriği analiz ediyor..." mesajı.
3. Cevap gelince **`AiSuggestionFormComponent`** açılır — tüm alanlar AI değerleriyle dolu Reactive Form:
   - `title` (text), `description` (textarea), `subject` (mat-select), `gradeLevel` (mat-select 1-12), `durationMinutes` (mat-slider), `difficulty` (mat-button-toggle), `outcomeCodes` (mat-chip-grid — autocomplete Catalog.API'den), `tags` (mat-chip-input).
   - Her alanın yanında küçük "AI önerisi" rozet'i; kullanıcı değiştirince rozet "manuel" olur (analytics için faydalı).
4. "Kaydet ve İncelemeye Gönder" → mevcut `POST /contents` → `POST /contents/{id}/versions` (yüklediği aynı ZIP'i tekrar yüklememek için: extract endpoint'i dosyayı geçici S3 key'e koysun, version create bu key'i tüketsin) → `POST /contents/{id}/submit`.
5. Hata durumu: AI extract başarısız → form boş açılır, kullanıcı elle doldurur (graceful degradation).

**Eski wizard ve simple upload sayfaları (`TeacherUploadPage`, `TeacherUploadWizard`) Angular tarafında portlanmaz.** Tek bir `TeacherUploadPage` (yeni AI-destekli sade akış) olur.

---

## Kritik Dosyalar

### Silinecek
- Komple `src/Web/dijitalatolye-web/` klasörü (cutover sonrası).

### Değişecek (Backend)
- [src/Services/Content/Content.API/Endpoints/ContentEndpoints.cs](src/Services/Content/Content.API/Endpoints/ContentEndpoints.cs) — yeni `/contents/ai-extract` map'i + helper.
- [src/Services/Content/Content.API/Bundles/BundleExtractor.cs](src/Services/Content/Content.API/Bundles/BundleExtractor.cs) — text-sampling için yardımcı method (zip-slip mantığı reuse).
- [src/Services/Catalog/Catalog.API/Endpoints/CatalogEndpoints.cs](src/Services/Catalog/Catalog.API/Endpoints/CatalogEndpoints.cs) — `/catalog/outcomes` endpoint.
- [Directory.Packages.props](Directory.Packages.props) — `HtmlAgilityPack` paketi.
- [src/Services/AIModeration/AIModeration.API/Llm/DeepSeekProvider.cs](src/Services/AIModeration/AIModeration.API/Llm/DeepSeekProvider.cs) — referans (yeni extractor benzer pattern'i kullanacak; ortak DeepSeek client'a refactor'lanabilir).

### Yeni (Backend)
- `src/Services/Content/Content.API/AiExtraction/IContentMetadataExtractor.cs`
- `src/Services/Content/Content.API/AiExtraction/DeepSeekMetadataExtractor.cs`
- `src/Services/Content/Content.API/AiExtraction/BundleTextSampler.cs`
- `src/Services/Content/Content.API/AiExtraction/CatalogOutcomeProvider.cs`

### Yeni (Frontend)
- `src/Web/dijitalatolye-web-ng/` — komple Angular projesi.
- `src/Web/dijitalatolye-web-ng/Dockerfile` — multi-stage (Node 22 + nginx 1.27, port 8080) — mevcut React Dockerfile'ı template olarak kullan.
- `deploy/` altındaki docker-compose / k8s manifest'lerinde frontend image adı ve build path güncellenir.

---

## Todo Listesi (Çalışma Sırası)

### Faz 0 — Hazırlık (1-2 gün)
- [ ] Mevcut React frontend'in tüm route ve component'lerinin map'ini çıkar (referans dokümanı, port sırasında rehber olacak).
- [ ] Mevcut API kontratlarını [src/Web/dijitalatolye-web/src/lib/api.ts](src/Web/dijitalatolye-web/src/lib/api.ts) ve tüm service çağrıları üzerinden çıkar, Angular tarafında aynısını implement etmek için TypeScript interface dosyası hazırla.
- [ ] Angular v21 CLI kurulumu, Tailwind + Material coexistence config'i (`postcss`, `tailwind.config.js`, Material preflight kapatma).
- [ ] CI/CD: yeni `dijitalatolye-web-ng` için pipeline ekle, eski'yi disable et (cutover'a kadar dokunma).

### Faz 1 — AI Extraction Backend (3-5 gün)
- [ ] [Catalog.API endpoint](src/Services/Catalog/Catalog.API/Endpoints/CatalogEndpoints.cs)'inde `GET /catalog/outcomes?subject=&grade=` ekle. Outcome tablosu/seed yoksa MEB CSV'den seed et.
- [ ] `HtmlAgilityPack` paketini [Directory.Packages.props](Directory.Packages.props)'a ekle.
- [ ] `BundleTextSampler` — ZIP'ten metin örnekleme (max 8K karakter, ilk N HTML).
- [ ] `CatalogOutcomeProvider` — Catalog.API HttpClient (Refit veya manuel).
- [ ] `DeepSeekMetadataExtractor` — JSON-mode prompt + Catalog outcome listesi enjeksiyonu. System prompt: "Sen MEB müfredatına hâkim bir eğitim uzmanısın. Aşağıdaki içerik metnine ve verilen kazanım listesine bakarak JSON formatında metadata üret. Kazanım kodlarını **yalnızca verilen listeden** seç."
- [ ] `POST /contents/ai-extract` endpoint'i — multipart upload, geçici S3 key'e yaz (sonradan version create için tüketilecek), extract'i çağır, DTO döner.
- [ ] xUnit testleri: sampler (mock ZIP), extractor (mock DeepSeek), endpoint integration.

### Faz 2 — Angular Iskeleti + Auth + Layout (5-7 gün)
- [ ] `ng new dijitalatolye-web-ng --standalone --routing --style=css --strict`.
- [ ] Tailwind + Material kurulum, [src/Web/dijitalatolye-web/tailwind.config.js](src/Web/dijitalatolye-web/tailwind.config.js)'den theme port.
- [ ] `core/auth/auth.store.ts` (Signals, localStorage persistence).
- [ ] `core/api/api.service.ts` + `auth.interceptor.ts` (401 → refresh).
- [ ] `core/guards/role.guard.ts` (Public/Authenticated/Teacher/Editor/Admin).
- [ ] `layouts/public-layout.component.ts`, `layouts/app-layout.component.ts`.
- [ ] i18n: `@ngx-translate/core` setup, mevcut `src/Web/dijitalatolye-web/src/locales/*.json` reuse.

### Faz 3 — Sayfa Port'u (10-15 gün)
- [ ] **Auth (5 sayfa):** Login, Register, ForgotPassword, ResetPassword, VerifyEmail.
- [ ] **Public (5 sayfa):** Home, About, Discover, ContentDetail, Collections.
- [ ] **Teacher (4 sayfa):** Dashboard, **UploadSimple (yeni AI akışı)**, MyContents, Profile.
- [ ] **Editor (4 sayfa):** Dashboard, Queue, Review, History.
- [ ] **Admin (7 sayfa):** Dashboard, Contents, Users, Catalog, AiConfig, Audit, Reports.
- [ ] Shared components: `CookieBanner`, `ErrorBoundary` (Angular `ErrorHandler`), `SeoHead` (Meta service), `ShareTools`, `StarRating`.

### Faz 4 — Yeni AI-Destekli Upload Sayfası (3-4 gün)
- [ ] `TeacherUploadSimpleComponent` — dropzone + auto-extract trigger.
- [ ] `AiSuggestionFormComponent` — Reactive Form, AI önerisi rozet'leri, Catalog autocomplete.
- [ ] E2E test (Playwright veya Cypress): ZIP yükle → form dolu görünür → editle → submit → backend'de Submitted state.

### Faz 5 — Cutover (1-2 gün)
- [ ] Staging'de yeni Angular SPA'yı eski React üzerinde test ortamına deploy et, smoke test (tüm 33 sayfa açılıyor mu, auth çalışıyor mu, upload akışı?).
- [ ] Üretim DNS/ingress'i Angular image'ına yönlendir.
- [ ] Eski `src/Web/dijitalatolye-web/` klasörünü ve eski Dockerfile'ı sil; CI'dan eski job'u kaldır.
- [ ] README, [02-Sistem-Mimarisi.md](02-Sistem-Mimarisi.md) ve diğer dokümanları güncelle.

### Faz 6 — Doğrulama
- [ ] Lighthouse skoru ≥ 90 (Performance, Accessibility, SEO).
- [ ] Tüm role'ler için manuel akış: register → login → upload (AI fill çalışıyor) → editor review → publish → public play.
- [ ] AI extract endpoint için metrik dashboard (response latency p95, başarı oranı, confidence ortalaması).

---

## Doğrulama (End-to-End)

1. **Backend AI extract:**
   ```bash
   cd src/Services/Content/Content.API && dotnet test
   # ve manuel:
   curl -F "file=@sample-bundle.zip" -H "Authorization: Bearer $TOKEN" \
     http://localhost:5000/api/contents/ai-extract
   ```
   Beklenen: 200 OK, dolu `AiExtractedMetadataDto` JSON.

2. **Catalog outcomes:**
   ```bash
   curl "http://localhost:5000/api/catalog/outcomes?subject=Matematik&grade=5"
   ```
   Beklenen: MEB kazanım kodları listesi.

3. **Angular dev server:**
   ```bash
   cd src/Web/dijitalatolye-web-ng && npm install && npm start
   ```
   `http://localhost:4200` açılır, login → teacher → upload → ZIP seç → AI form dolar → submit.

4. **Docker build:**
   ```bash
   docker compose -f deploy/docker-compose.yml up -d --build web-ng
   ```

5. **Cutover sonrası smoke:** tüm 33 route açılır, console hatasız.

---

## Riskler & Karşı Önlemler

| Risk | Önlem |
|---|---|
| Angular v21 stabilitesi (yeni release) | LTS'e geri çekilebilir (v20) — package.json'da kolayca downgrade. |
| DeepSeek prompt'ta MEB kazanım listesi token limitini aşar | Konu+sınıfa göre filtreleme; gerekirse ilk 100 kazanım. |
| AI confidence düşük olursa kullanıcı her alanı düzeltmek zorunda kalır | UI'da "AI önerisi / manuel" rozet'i + analytics; düşük confidence'lı alan kırmızı border. |
| Hard cutover sırasında bug = tüm kullanıcı etkilenir | Staging'de 1 hafta tüm role'lerle paralel kullanım; feature flag yok ama nginx rollback hazır. |
| Mevcut React i18n JSON'larının Angular'a uyumu | `@ngx-translate` JSON yapısı React-i18next ile %95 uyumlu, küçük dönüşüm scripti gerekirse. |

---

## Tahmini Süre

- Faz 0: 1-2 gün
- Faz 1 (AI backend): 3-5 gün
- Faz 2 (Angular iskelet): 5-7 gün
- Faz 3 (33 sayfa port): 10-15 gün
- Faz 4 (yeni upload): 3-4 gün
- Faz 5 (cutover): 1-2 gün
- Faz 6 (doğrulama): 2-3 gün

**Toplam: ~5-7 hafta** (tek geliştirici, full-time).
