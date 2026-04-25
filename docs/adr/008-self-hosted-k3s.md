# ADR-008: Self-Hosted K3s + VPS

- **Durum:** Accepted
- **Tarih:** 2026-04-25
- **Karar veren:** Veli Keçeci

## Bağlam

`02-Sistem-Mimarisi.md` GCP + Cloud Run önerdi (Yargısalzeka deneyimi ile uyumlu). Ancak proje sahibi **self-hosted** tercih etti — KVKK/veri rezidansı, maliyet öngörülebilirliği ve bağımsızlık nedenleriyle.

## Karar

**K3s** (Rancher Labs, hafif K8s) + **3 node VPS** (1 master + 2 worker) ile başla. VPS sağlayıcısı **Hetzner Cloud** (Türkiye yakın DC, KVKK uyumu için Türkiye-içi sağlayıcılarla devam karar revize edilebilir).

| Bileşen | Seçim | Notlar |
|---------|-------|--------|
| Cluster | K3s 1.30+ | Tek binary, gömülü etcd (3+ node ile HA) |
| Ingress | Traefik (K3s default) | TLS via cert-manager + Let's Encrypt |
| Storage | Longhorn 1.7+ | Replica 2, volume snapshot |
| Secret | sealed-secrets veya External Secrets + Vault | Faz 1 sealed-secrets, Faz 4 Vault |
| Backup | Velero + S3 (MinIO veya backup VPS) | Günlük scheduled |
| GitOps | ArgoCD | Helm chart deploy |
| WAF / DDoS | Cloudflare (proxy mode) | Edge layer |
| Monitoring | kube-prometheus-stack + Loki + Tempo | Aynı cluster |

**Lokal geliştirme:** `docker-compose` ile bağımlılıklar (PostgreSQL, RabbitMQ vb.) + `dotnet run` ile servisleri çalıştır. K3s sadece staging/prod.

## Gerekçe

- **Maliyet:** Hetzner CCX23 (4 vCPU dedicated, 16GB RAM) ~€30/ay × 3 = €90. + load balancer + traffic ~€110/ay başlangıç. GCP eşdeğeri 3-4x.
- **Veri rezidansı:** GCP eu-west / us-central yerine Hetzner FSN1 (Almanya) veya KVKK-tam Türkiye sağlayıcıları (Turkcell Cloud, Türk Telekom Cloud — Faz 4'te netleşecek).
- **Vendor lock-in yok:** K3s standart Kubernetes; ileride GKE/EKS'e taşıma chart'lar ile mümkün.
- **Cloud Run YOK gerekçesi:** Cloud Run cold start, persistent connection (RabbitMQ, Elasticsearch) için zayıf, K8s-ish özellikler kısıtlı (sidecar yok), ölçek arttığında GKE'ye geçiş karmaşık.

## Sonuçlar

**Olumlu:** Maliyet öngörülebilir, veri rezidansı kontrollü, K8s portable, on-prem benzeri öğrenim.

**Olumsuz:**
- **Operasyonel yük yüksek:** Backup, certificate, node failure, security patching tek geliştirici için yorucu → Faz 4'ten önce **runbook + alarm + on-call rotasyonu** zorunlu (`docs/runbooks/`).
- **HA için 3+ node şart:** etcd quorum (1 master kaybedilmemeli) → 3 master, 2 worker konfigürasyonuna ihtiyaç olabilir Faz 3'te.
- **Tek sağlayıcı bağımlılığı:** Hetzner outage'ı = tüm sistem down. V2'de multi-region veya secondary cluster.

## Alternatifler

- **GCP + Cloud Run / GKE Autopilot:** Mimari dokümandaki öneri. Ekipte deneyim var, kolay; ama maliyet ve veri rezidansı.
- **AWS EKS:** Pahalı, EKS control plane $73/ay tek başına.
- **Azure AKS:** MEB ekosistemi için cazip (Microsoft genelde Türkiye kamu için aktif), Faz 4'ten sonra MEB iş birliği netleşirse revize edilebilir (ADR-008b).
- **Türk sağlayıcılar (Turkcell Cloud, Türk Telekom Cloud, Garantibbva):** KVKK için ideal ama K8s desteği genelde managed değil; VPS olarak başlanabilir. Faz 4 öncesi netleştirilmeli.
- **DigitalOcean Kubernetes:** Hetzner kadar hesaplı değil ama Türkiye'ye yakın DC yok.
