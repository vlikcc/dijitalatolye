# DijitalAtölye — Eksik Özellikler: Boşluk Analizi, Plan ve Takip Listesi

**Tarih:** 2026-04-28
**Kaynak:** `01-PRD-DijitalAtolye.md` ↔ mevcut kod tabanı.
**Durum:** Faz A devam ediyor (manifest validasyonu, publish-copy, revize akışı **tamamlandı**; E2E doğrulaması açık).

---

## 1. Boşluk Analizi (PRD ↔ Kod)

| Alan | Mevcut | Eksik |
|---|---|---|
| **Identity** | register/login/refresh/forgot/reset password | E-posta doğrulama akışı, Google OAuth, 2FA (TOTP), MEB e-postası otomatik doğrulama, login için brute-force rate-limit |
| **Storage** | presigned upload/download, ClamAV scan | (Faz A'da çözüldü: ZIP açma + manifest validasyonu Content.API tarafına eklendi) |
| **Content** | CRUD, versiyon, submit, like/favorite/comment, slug, play endpoint | (Faz A'da çözüldü: manifest validation, kapak görseli alanları, hedef yaş/süre/zorluk metadata, revizyon→Draft endpoint, Approve→published bucket kopyalama, play published bucket kullanımı) |
| **AI Moderation** | DeepSeek + statik analiz (HTML/JS) + Mongo report + token & maliyet log | Gemini & Claude provider, manuel "yeniden analiz" endpoint'i, response cache, opsiyonel Playwright headless screenshot |
| **Review** | queue, decision, dashboard, history | Performans metrikleri ölçümü, frontend klavye kısayolları |
| **Notification** | SMTP + SignalR, 4 event consumer | Şablon sistemi (Razor / Handlebars), kullanıcı bildirim tercihleri, web push |
| **Search** | full-text + by-slug | Faceted aggregations, more-like-this önerileri, reindex endpoint, TR analyzer mapping doğrulama |
| **Analytics** | events, content summary | Öğretmen raporu (en popüler içerik), kategori bazlı raporlar, batch insert worker / TimescaleDB |
| **Catalog** | grades/subjects/categories/outcomes/tags CRUD | MEB JSON import scripti, cascading endpoint'ler (subject→outcomes) |
| **Admin** | dashboard stub, audit log endpoint, AI config UI, users proxy | Mock data temizliği (`AdminProxyEndpoints` `publishedToday=5` vb.), audit topic dispatcher tüketicisi, AI config persistence, gerçek raporlar |
| **Engagement / FE** | like/favorite/comment, basit native share | 5★ rating, koleksiyonlar, QR kod, embed snippet, social share (Twitter/WhatsApp/Facebook), revize UI'sı |
| **SEO / FE Polish** | basit `<head>` yok | React Helmet, OG / Twitter card, `sitemap.xml`, `robots.txt`, lazy load, code split |
| **KVKK** | `KvkkPage` statik | Cookie banner, hesap silme, veri export, gizlilik politikası |
| **Test / CI** | unit + bazı integration | E2E (Playwright) kritik akışlar, k6 load, OWASP ZAP, gitleaks |
| **Gözlemlenebilirlik** | Serilog, healthcheck | OpenTelemetry trace exporter konfigürasyonu, Sentry DSN aktif değil, Prometheus `/metrics` endpoint'i |

---

## 2. Faz Bazlı Plan

### Faz A — Onay Akışı Tamlığı (en kritik) — **TAMAMLANDI**
1. Storage: ZIP açma + manifest.json zorunlu validasyon (`entry`, `title`, `version`); whitelist enforcement.
2. Content: ContentMetadata ek alanları (targetAge, durationMinutes, difficulty, coverImageKey); manifest validasyonu; revizyon talep edildiğinde otomatik `Draft` geçişi + tekrar yükleme.
3. AIModeration: cache + maliyet logging; Gemini & Claude provider.
4. Content publish: Approval anında `dijitalatolye-content-published` bucket'ına kopyalama; play endpoint published bucket'ı kullanır.

### Faz B — Identity & Auth Sıkılaştırma
5. E-posta doğrulama (token üretimi → Notification servisine event).
6. Google OAuth provider.
7. 2FA TOTP (admin için zorunlu).
8. Login için rate-limit (`Microsoft.AspNetCore.RateLimiting`).

### Faz C — Keşif Derinleştirme
9. Search faceted aggregations + reindex endpoint.
10. More-like-this öneri endpoint'i.
11. TR analyzer mapping (`icu_analyzer` veya `turkish_lowercase` + `asciifolding`).
12. Frontend: faceted UI, kategori sayfaları, öneri carousel.

### Faz D — Etkileşim & Paylaşım
13. 5★ rating (entity + endpoint + UI).
14. Koleksiyonlar (User servisinde).
15. QR kod, embed iframe snippet, social share butonları.
16. Web push (VAPID + Notification servisi).

### Faz E — Yönetim & Gözlemlenebilirlik
17. Admin mock'larını gerçek aggregations'a çevir; AI config persist.
18. Audit topic dispatcher + Elasticsearch'e index.
19. OpenTelemetry exporter (Tempo/Jaeger), Sentry DSN, Prometheus `/metrics`.

### Faz F — Bildirim & Content Extras
20. Notification şablon sistemi (Razor file-based).
21. Kullanıcı bildirim tercihleri.
22. Catalog: MEB JSON importer.

### Faz G — SEO, KVKK, Test
23. React Helmet + OG + sitemap.
24. Cookie banner, hesap silme / data export endpoint'leri.
25. Playwright E2E (kayıt → yükle → AI → onay → yayın → oynat).
26. k6 load + OWASP ZAP CI job.

### Tahmini Efor (tek kişi, full-time)

| Faz | Süre |
|---|---|
| A | 1–1.5 hafta (tamamlandı) |
| B | 1 hafta |
| C | 1 hafta |
| D | 1 hafta |
| E | 1 hafta |
| F | 0.5 hafta |
| G | 1.5 hafta |
| **Toplam** | **~7–8 hafta** |

---

## 3. Takip Listesi (Özet)

### Faz A (tamamlandı)
- [x] Manifest + bundle validator utility (`Content.API/Bundles/BundleValidator.cs`)
- [x] `POST /contents/{id}/versions` validator entegrasyonu, ManifestJson parse, SHA-256
- [x] Content extra metadata alanları (TargetAge, DurationMinutes, Difficulty, CoverImage, PublishedBucket/Key)
- [x] Revizyon döngüsü endpoint (`POST /contents/{id}/revise`) + frontend buton
- [x] `PUT /contents/{id}/metadata` (Draft/RevisionRequested durumda metadata güncelle)
- [x] Publish copy (Approved → `dijitalatolye-content-published` bucket'ı, MinIO `CopyObjectAsync`)
- [x] Play endpoint published bucket fallback
- [x] AI moderation token / maliyet logging persist (`ModerationReport` + pipeline)
- [x] Frontend wizard: yeni metadata alanları, backend ile alan adı uyumu
- [x] `TeacherMyContentsPage` revize butonu

### Faz B
- [ ] Identity: e-posta doğrulama (token + `EmailVerificationRequested` event + Notification consumer)
- [ ] Identity: Google OAuth provider entegrasyonu
- [ ] Identity: 2FA TOTP, admin için zorunlu policy
- [ ] Identity: login için rate-limit middleware
- [ ] Identity: refresh token rotation review

### Faz C
- [ ] Search: aggregations (subject, gradeLevel, tags, outcome facetleri)
- [ ] Search: more-like-this endpoint
- [ ] Search: reindex endpoint (admin)
- [ ] Search: TR analyzer + asciifolding mapping
- [ ] Frontend: faceted UI + kategori sayfaları + öneri carousel

### Faz D
- [ ] ContentRating entity + endpoint + UI (5★)
- [ ] User: Koleksiyon CRUD endpoint
- [ ] Frontend: koleksiyon yönetimi UI'sı
- [ ] Frontend: QR kod modal (qrcode paketi)
- [ ] Frontend: embed iframe snippet modal
- [ ] Frontend: social share butonları
- [ ] Web push (VAPID, Notification servisinde)

### Faz E
- [ ] Admin endpoint'lerinde mock data temizliği
- [ ] AI config persistence (DB + endpoint)
- [ ] Audit RabbitMQ topic + Elasticsearch indeksleyici
- [ ] OpenTelemetry exporter konfigürasyonu (compose env)
- [ ] Sentry DSN + Prometheus `/metrics`

### Faz F
- [ ] Notification: Razor şablon sistemi
- [ ] Notification: kullanıcı tercih ayarları (entity + endpoint + UI)
- [ ] Catalog: MEB JSON import (admin endpoint + script)
- [ ] Catalog: cascading subject → outcomes endpoint

### Faz G
- [ ] React Helmet entegrasyonu (her sayfa için meta + OG)
- [ ] Sitemap.xml + robots.txt
- [ ] KVKK: cookie banner komponenti
- [ ] KVKK: hesap silme akışı (Identity + User + Content cascade)
- [ ] KVKK: kullanıcı veri export endpoint
- [ ] Playwright E2E senaryoları (kayıt, yükle, AI, onay, yayın, oyna)
- [ ] k6 load test scripti
- [ ] OWASP ZAP CI job

---

## 4. E2E Doğrulama Notları (Faz A)

E2E testi sırasında bulunan ve düzeltilen yan etkiler:

- `BuildingBlocks.Outbox.OutboxDispatcher` — `Type.GetType(name)` çağrısı yalnızca `mscorlib` + çağıran assembly'i tarıyordu; EventBus.Contracts assembly'sindeki tip adlarını çözemediği için tüm outbox mesajları `Type not found` ile başarısız oluyordu. Tüm yüklü assembly'leri tarayan `ResolveType` cache'li yardımcı eklendi (`OutboxDispatcher.cs`).

E2E akışı:

1. Login → JWT
2. `POST /contents` (draft + yeni metadata)
3. `POST /storage/uploads/presigned`
4. `PUT` ile presigned URL'e ZIP yükle
5. `POST /contents/{id}/versions` → BundleValidator manifest.json zorunluluğu, dosya türü whitelist, entry varlığı, SHA-256
6. `POST /contents/{id}/submit` → Outbox → `ContentSubmitted` event
7. AI moderation tüketici → ZIP indir → statik analiz + LLM → `AIModerationCompleted`
8. Editor `POST /review/{id}/decision` (Approved) → `EditorDecisionMade`
9. Content service decision consumer → state Approved → published bucket'a kopya → state Published → slug → `ContentPublished`
10. Search indexer → ES'e ekle
11. `GET /api/contents/by-slug/{slug}/play` → 302 → MinIO presigned URL → iframe HTML render
