# Getting Started — DijitalAtölye

İlk kurulumdan vertical slice demosuna kadar adım adım rehber.

## 1. Gereksinimler

- **.NET 10 SDK** ([indir](https://dotnet.microsoft.com/download))
- **Node.js 22+** ve **npm** (frontend için)
- **Docker** veya **Podman** (lokal bağımlılıklar için)
- **GNU Make** (opsiyonel — alternatif: tüm komutları doğrudan çalıştırabilirsin)
- **DeepSeek API Key** — [Faz 1'den itibaren gerekli](adr/009-ai-moderation-real-llm-from-start.md), https://platform.deepseek.com adresinden al

## 2. Repo'yu klonla

```bash
git clone https://github.com/dijitalatolye/dijitalatolye.git
cd dijitalatolye
```

## 3. Ortam değişkenlerini ayarla

```bash
make env
# Veya elle:
cp .env.example .env
```

`.env` içinde **mutlaka** doldur:
- `DEEPSEEK_API_KEY` (Faz 1'den itibaren AI Moderation için)
- `JWT_SIGNING_KEY` (en az 32 karakter rastgele string)

## 4. Bağımlılıkları başlat

```bash
make up
```

Bu komut PostgreSQL, MongoDB, RabbitMQ, Redis, Elasticsearch, MinIO, ClamAV ve Mailhog'u Docker container olarak ayağa kaldırır. UI'lar:

- **RabbitMQ Management:** http://localhost:15672 (`.env` içindeki `POSTGRES_USER` / `COMPOSE_DEV_SECRET`)
- **MinIO Console:** http://localhost:9001
- **Mailhog (e-postalar):** http://localhost:8025

## 5. Migration'ları çalıştır

```bash
make migrate
```

Tüm servislerin EF Core migration'larını sırayla uygular.

## 6. Servisleri başlat

Her servisi ayrı terminalde:

```bash
make run-identity         # http://localhost:5001
make run-user             # http://localhost:5002
make run-catalog          # http://localhost:5003
make run-storage          # http://localhost:5004
make run-content          # http://localhost:5005
make run-aimoderation     # http://localhost:5006
make run-review           # http://localhost:5007
make run-notification     # http://localhost:5008
make run-gateway          # http://localhost:5000  (tüm istekler buraya gelir)
```

> **İpucu:** [Tilt](https://tilt.dev), [Aspire](https://learn.microsoft.com/dotnet/aspire/) veya [tmux](https://github.com/tmux/tmux) ile hepsini tek komutla yönetebilirsin. Bkz. `Tiltfile` (Faz 1'de eklenir).

## 7. Frontend

```bash
make web-install   # Bir kez
make web           # http://localhost:5173
```

## 8. İlk End-to-End Test

1. http://localhost:5173/register adresinden öğretmen olarak kayıt ol.
2. Mailhog (http://localhost:8025) üzerinden onay e-postasını al, link'e tıkla.
3. Login → http://localhost:5173/teacher/contents/new
4. Bir HTML5 oyunun ZIP'ini yükle, metadata gir (sınıf, ders, kazanım, etiket).
5. "Gönder" → AI Moderation otomatik çalışır (DeepSeek gerçek çağrı).
6. Aynı kullanıcıya admin tarafından `Editor` rolü ver (lokal seed): http://localhost:5173/editor/queue
7. İncele → Onayla.
8. http://localhost:5173/play/<slug> → sandboxed iframe içinde oyna.

## 9. Test çalıştır

```bash
make test       # LiveLLM hariç tüm testler
make test-llm   # Gerçek DeepSeek API çağrısı yapan testler (DEEPSEEK_API_KEY gerekli)
```

## 10. Hata ayıklama

- **Loglar:** Her servis Serilog ile console + OTLP'ye yazar. Lokal'de Loki yoksa console yeterli.
- **Trace:** Faz 0'da OTLP exporter etkin değil, Faz 4'te Tempo entegre edilir.
- **Metrik:** http://localhost:5001/metrics (her servis Prometheus endpoint'i)
- **Healthcheck:** http://localhost:5001/health/live ve `/health/ready`

## Sonraki Adımlar

- Mimari: [`02-Sistem-Mimarisi.md`](../02-Sistem-Mimarisi.md)
- ADR'lar: [`docs/adr/`](adr/)
- Katkıda bulunma: [`CONTRIBUTING.md`](../CONTRIBUTING.md)
