# DijitalAtölye — Kapalı Beta Lansman Runbook (Docker Compose)

Kapsam: 50–200 öğretmen davetli kullanıcı, 1 hafta sınırlı erişim, geri bildirim
toplama. Deploy hedefi: `docker-compose.prod.yml` + Caddy (self-hosted tek sunucu).

## T-7 Gün: Hazırlık

- [ ] **Sunucu hazır**: Ubuntu 22.04+, 8 vCPU / 16 GB RAM, Docker 24+ kurulu.
- [ ] **Ortam dosyası**: `make prod-env` → `.env.prod` dolduruldu (`PUBLIC_DOMAIN`, `JWT_SIGNING_KEY`, `DEEPSEEK_API_KEY`, SMTP).
- [ ] **DNS**: `PUBLIC_DOMAIN` A/AAAA kaydı sunucu IP'sine işaret ediyor.
- [ ] **TLS**: Gerçek domain için `ACME_EMAIL` set; lokal test için `localhost` + internal CA.
- [ ] **DB yedekleri**: `crontab` ile günlük `make prod-backup` (bkz. [selfhost-prod.md](selfhost-prod.md)).
- [ ] **Gözlemlenebilirlik** (önerilir):
  ```bash
  docker compose -f deploy/docker-compose/docker-compose.prod.yml \
    -f deploy/docker-compose/docker-compose.observability.yml \
    --env-file .env.prod --profile observability up -d
  ```
  `SENTRY_DSN` ve `OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317` set edildi.
- [ ] **Davetli listesi**: 50–200 e-posta, KVKK aydınlatma metni paylaşıldı.

## T-3 Gün: Yük & Güvenlik

- [ ] `tests/load/k6/scenarios/discover.js` 200 VU 5dk koştu, p95 < 600ms.
- [ ] `tests/load/k6/scenarios/auth.js` 50 VU 2dk, p95 < 800ms.
- [ ] GitHub Actions `nightly.yml` ZAP baseline temiz (veya manuel ZAP).
- [ ] Security headers (`securityheaders.com`) en az "A".
- [ ] CSP + sandbox iframe oynatma test edildi.
- [ ] Rate limiter: `/api/auth/login` 11. istekte 429.

## T-1 Gün: Final Hazırlık

- [ ] `make prod-up` başarılı, `make prod-smoke` yeşil.
- [ ] Google OAuth (`GOOGLE_OAUTH_*`) veya e-posta doğrulama akışı test edildi.
- [ ] Admin 2FA zorunluluğu aktif admin hesaplarında doğrulandı.
- [ ] On-call rotasyonu belirlendi.
- [ ] Geri bildirim formu (Google Form / Tally) hazır.

## T-0 (Lansman Günü)

1. `make prod-up` (veya `docker compose ... up -d --build`).
2. Smoke: `make prod-smoke` ve `scripts/smoke-vertical-slice.sh` (`BASE_URL=https://$PUBLIC_DOMAIN`).
3. Davet e-postaları gönderildi.
4. İlk 30 dk: Sentry, Grafana (localhost:3000), Prometheus (localhost:9090).
5. RabbitMQ management (127.0.0.1:15672), Outbox tabloları izleniyor.

## T+1 / T+3 / T+7

- T+1: Aktif kullanıcı, AI moderation p95, hata oranı.
- T+3: Editör kuyruğu, red nedenleri, prompt güncellemesi.
- T+7: Geri bildirim kapanışı, retro, V1.1 backlog.

## Olay Yanıtı

| Şiddet | Tanım | Tepki | Aksiyon |
|--------|-------|-------|---------|
| SEV-1 | Tüm sistem erişilemez | 15 dk | `make prod-logs`, Caddy/gateway kontrol, gerekirse önceki image tag |
| SEV-2 | Tek servis 5xx | 1 saat | `docker compose ps`, unhealthy servisi restart |
| SEV-3 | Yavaşlama | 4 saat | Prometheus `/metrics`, ES/Mongo disk |

**Rollback**: Önceki `IMAGE_TAG` ile `docker compose up -d`. EF migration'lar idempotent.

## KVKK

- `/kvkk` sayfası, çerez banner, hesap silme talebi (`/account-delete`), veri export (profil).
