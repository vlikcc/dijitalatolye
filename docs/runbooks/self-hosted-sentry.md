# Self-hosted Sentry Kurulum Notları

DijitalAtölye, hata izleme için self-hosted Sentry kullanır. Üretim cluster'ına
ek bir node grubu (4 vCPU / 8 GB RAM minimum) önerilir.

## Gereksinimler

- Docker 20+ veya K3s/K8s
- 4 vCPU, 8 GB RAM, 50 GB SSD
- PostgreSQL 14+ (paylaşımlı veya kendi)
- Redis 6+ (Sentry kendi getirir)
- Kafka (Sentry kendi getirir)

## Hızlı Kurulum (Tek Sunucu)

```bash
git clone https://github.com/getsentry/self-hosted.git
cd self-hosted
git checkout 24.10.0
./install.sh
docker compose up -d
```

İlk admin: `docker compose run --rm web createuser`.

DSN'leri Sentry UI'dan alıp her servis için aşağıdaki env var'ı set edin:

```
SENTRY_DSN=https://<key>@sentry.dijitalatolye.org/<project-id>
SENTRY_ENVIRONMENT=production
```

DijitalAtölye servisleri `SENTRY_DSN` boşsa Sentry'yi devre dışı bırakır
(`HostBuilderExtensions.ConfigureSentry`), o yüzden lokalde otomatik kapalı
gelir.

## Kubernetes (Helm)

Sentry Helm chart'ı: <https://github.com/sentry-kubernetes/charts>. Cluster'a
ayrı namespace (`sentry`) açın, `values.yaml`'da PostgreSQL/Redis/Kafka için
boyutları ayarlayın. ArgoCD application olarak ayrı yönetilebilir.

## Operasyon

- Günlük yedek: `pg_dump sentry > backups/sentry-$(date +%F).sql`
- Sentry'nin kendi event retention'ı 90 gün (default).
- Disk doluluk uyarısı için Prometheus alert kuralı önerilir.
