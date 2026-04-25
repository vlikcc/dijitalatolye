# Faz 1 Vertical Slice Demo — Çalıştırma Rehberi

Bu doküman, Faz 1 sonunda hedeflenen uçtan uca demoyu çalıştırma adımlarını anlatır:

> **Demo Akışı:** Öğretmen kayıt → ZIP yükle → AI Moderation (DeepSeek) → Editör onay → Public play.

## 1. Bağımlılıkları Başlat

```bash
make up
# Postgres, Redis, RabbitMQ, MinIO, MongoDB, ClamAV docker-compose ile ayağa kalkar
```

## 2. Servisleri Çalıştır (her biri ayrı terminalde)

```bash
make run-identity      # 5101
make run-user          # 5102
make run-catalog       # 5103
make run-storage       # 5104
make run-content       # 5105
make run-aimoderation  # 5106
make run-review        # 5107
make run-notification  # 5108
make run-gateway       # 5000 (YARP)
```

`Make` hedefleri yoksa: `dotnet run --project src/Services/<Servis>/<Servis>.API` ile başlatılabilir.

## 3. Frontend

```bash
cd src/Web/dijitalatolye-web
cp .env.example .env.local   # gerekirse VITE_API_BASE_URL ayarla (default: /api)
pnpm install
pnpm dev    # http://localhost:5173
```

## 4. Manuel Smoke Test Akışı

1. `http://localhost:5173/register` → Öğretmen olarak kayıt ol (`teacher@example.com`).
2. Aynı kullanıcıya manuel olarak `Editor` rolü ata (V1 demo amacı için):

   ```bash
   # Identity DB'ye:
   docker exec -it dijitalatolye-postgres psql -U postgres -d identity \
     -c "INSERT INTO \"AspNetUserRoles\"(\"UserId\",\"RoleId\") VALUES (...);"
   ```

   Veya Identity Service'in `/auth/grant-role` admin endpoint'i (Faz 4'te eklenecek).

3. `/login` → giriş yap, JWT cookie/localStorage'a düşer.
4. `/teacher/contents/new` → ZIP yükle.
   - Form: title, description, gradeLevel, subject, kazanım kodları, etiketler, ZIP dosyası.
   - Adımlar: Content meta → Storage presigned URL → MinIO upload → Version register → Submit.
5. RabbitMQ Management UI (`http://localhost:15672`): `content.submitted.v1` event geldi mi?
6. AI Moderation Service log'larında DeepSeek çağrısı yapıldı mı? MongoDB'de `moderation_reports` dokümanı oluştu mu?
7. `/editor/queue` → kuyrukta yeni içerik göründü mü?
8. `/editor/review/{id}` → AI raporu, kritik bayraklar, uyarılar görünüyor mu?
9. **Onayla** → `editor.decision.made.v1` event yayınlanır → Content Service `Approved → Published` durumuna geçer.
10. `/play/{slug}` → İçerik sandboxed iframe'de oynar.

## 5. Doğrulama Kontrol Listesi

- [ ] JWT auth + refresh token döngüsü çalışıyor.
- [ ] MinIO bucket'ında `content/<contentId>/<versionId>.zip` oluştu.
- [ ] ClamAV scan endpoint'i temiz döndü (`POST /api/storage/scan`).
- [ ] AI Moderation raporu MongoDB'de `report.staticAnalysis`, `report.llm`, `report.decision` ile dolu.
- [ ] Cost log: DeepSeek token + USD maliyeti Grafana'da görülebilir (OTLP -> Loki).
- [ ] Review queue priority sıralaması doğru (skor + bekleme süresi).
- [ ] Notification Service in-app + e-posta gönderdi (SMTP konfigürasyonlu ise).
- [ ] Public `/play/{slug}` endpoint'i CSP header (`Content-Security-Policy`) ile geliyor.

## 6. Bilinen Eksikler (Faz 2'ye)

- Sandboxed iframe için CSP final tuning + dinamik nonce.
- Çok adımlı (4-step) yükleme formu (şu an tek form).
- Editör klavye kısayolları, panel iyileştirme.
- Playwright headless ile screenshot → LLM görsel context.
- AI prompt iterasyonu (Türkçe pedagojik test seti).
- Analytics Service (view/play tracking).

## 7. Hızlı Smoke Test (curl)

`./scripts/smoke-vertical-slice.sh` ile uçtan uca akışı API üzerinden test edebilirsin (sadece API katmanı).
