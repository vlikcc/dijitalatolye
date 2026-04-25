# DijitalAtölye — Kapalı Beta Lansman Runbook

Kapsam: 50–200 öğretmen davetli kullanıcı, 1 hafta sınırlı erişim, geri bildirim
toplama. Bu doküman lansman öncesi/anı/sonrası kontrol listesini içerir.

## T-7 Gün: Hazırlık

- [ ] **Sunucu hazır**: Hetzner/UpCloud K3s cluster'ı ayağa kalkmış
  (`ansible/k3s.yml` çalıştırıldı), 3 node, kubeconfig elimde.
- [ ] **DNS**: `app.dijitalatolye.org`, `api.dijitalatolye.org`,
  `cdn.dijitalatolye.org` A/AAAA kayıtları yapıldı.
- [ ] **TLS**: cert-manager Let's Encrypt ClusterIssuer kuruldu, sertifikalar
  geçerli.
- [ ] **DB yedekleri**: Pg `pgbackrest` veya günlük `pg_dump` cron tanımlı,
  S3-uyumlu MinIO bucket'a gidiyor.
- [ ] **Gözlemleme**: Loki + Grafana + Tempo + Prometheus dashboard'ları açık,
  Sentry projesi başlatıldı, Sentry DSN tüm servislerde set edildi.
- [ ] **Davetli listesi**: 50–200 e-posta, KVKK aydınlatma metni e-postada
  paylaşıldı.

## T-3 Gün: Yük & Güvenlik

- [ ] `tests/load/k6/scenarios/discover.js` 200 VU 5dk koştu, p95 < 600ms.
- [ ] `tests/load/k6/scenarios/auth.js` 50 VU 2dk, p95 < 800ms.
- [ ] OWASP ZAP baseline scan staging URL'ine karşı temiz.
- [ ] Security headers doğrulaması (`securityheaders.com`) en az "A".
- [ ] CSP staging'de aktif, sandboxed iframe oynatma sorunsuz.
- [ ] Rate limiter testi: `/api/auth/login` 11. istekte 429 dönüyor.

## T-1 Gün: Final Hazırlık

- [ ] Identity Service'te beta kullanıcılar için davet kodu (`InviteOnly` mod)
  açıldı.
- [ ] Frontend `.env.production`'a `VITE_BETA_BANNER=true` eklendi.
- [ ] Status page hazır (`status.dijitalatolye.org`, basit Statuspage / Uptime
  Kuma).
- [ ] On-call rotasyonu: 1. hafta için kim primary kim backup belirlendi.
- [ ] Geri bildirim formu (`/feedback`) ayrı bir Google Form / Tally formuna
  yönlendiriyor.

## T-0 (Lansman Günü)

1. Maintenance window kapat (varsa).
2. ArgoCD ile `release/v1.0-beta` etiketli imajları prod cluster'a deploy et.
3. Smoke test: `scripts/smoke-vertical-slice.sh` staging URL'ine karşı
   başarılı.
4. Davet e-postaları gönderildi (200 alıcı), bounce'lar takip altında.
5. İlk 30 dk Sentry, Grafana, Loki ekranları sürekli izlemede.
6. RabbitMQ DLQ kuyruğu, Outbox tablosu izleniyor.

## T+1 / T+3 / T+7

- T+1: Toplam aktif kullanıcı, AI moderation gecikmesi p95, hata oranı raporu.
- T+3: Editör kuyruğu birikimi, en sık reddedilen tipler analizi, prompt
  güncellemesi gerekirse `AIModeration:PromptVersion` v3'e taşınır.
- T+7: Geri bildirim toplama formu kapatılır, retro hazırlanır, V1.1 backlog
  oluşturulur.

## Olay Yanıtı (Incident Response)

| Şiddet | Tanım | Tepki Süresi | Aksiyon |
|--------|-------|--------------|---------|
| SEV-1  | Tüm sistem erişilemez | 15 dk | On-call sayfa, Sentry alarm, gerekiyorsa rollback |
| SEV-2  | Tek servis bozuk (örn. AI moderation 5xx) | 1 saat | Servis bazında scale veya rollback |
| SEV-3  | Yavaşlama, kısmi hata | 4 saat | Grafana inceleme, sonraki release'e fix |

Rollback: `argocd app rollback dijitalatolye-prod --to <revision>`. Veritabanı
migration'ları idempotent olduğu için geri alınabilir.

## KVKK & Veri Talepleri

- Kullanıcı `/kvkk` sayfasından kendi verisini export edebilir, profilini
  anonimleştirebilir.
- İçerik silme talepleri için `kvkk@dijitalatolye.org` adresi yayında, talepler
  72 saat içinde işlenir.
- Veri ihlali şüphesi durumunda KVKK'ya 72 saat içinde bildirim hazır şablon:
  `docs/legal/data-breach-notification-tr.md` (henüz yazılacak).
