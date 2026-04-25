# Runbook'lar

Production sorunları için adım adım rehberler. ADR-008 (self-hosted K3s) gereği tek geliştirici operasyonel yükünü azaltmak için kritik.

| Runbook | Senaryo |
|---------|---------|
| [postgres-down.md](postgres-down.md) | PostgreSQL pod down / connection refused |
| [rabbitmq-clogged.md](rabbitmq-clogged.md) | Mesaj kuyruğu birikiyor, consumer lag |
| [aimoderation-llm-failure.md](aimoderation-llm-failure.md) | DeepSeek API down / rate limit |
| [k3s-node-down.md](k3s-node-down.md) | Worker node response vermiyor |
| [cert-expiring.md](cert-expiring.md) | TLS sertifikası 7 gün içinde dolacak |
| [content-storage-full.md](content-storage-full.md) | MinIO disk %85+ |
| [backup-restore.md](backup-restore.md) | DB / object storage restore prosedürü |

> Faz 0'da iskelet — her runbook Faz 1+ ilerledikçe gerçek sorunlar kaydedildikçe doldurulacak.

## Format

```
# Runbook: <Başlık>

## Belirti
- Alarm: ...
- Kullanıcı şikayeti: ...

## Hızlı Kontrol
```bash
kubectl ...
```

## Kök Sebep Olasılıkları
1. ...
2. ...

## Çözüm Adımları
1. ...
2. ...

## Postmortem Sorusu
- Bu sorun nasıl tekrar olmaz?
```
