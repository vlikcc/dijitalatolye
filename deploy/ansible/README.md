# K3s Bootstrap (Ansible)

Self-hosted K3s cluster'ı sıfırdan ayağa kaldıran playbook.

## Gereksinimler

- 3 VPS (Ubuntu 22.04+, minimum 4 vCPU/16GB RAM önerilir)
  - Hetzner CCX23 önerilen (~€30/ay × 3 = ~€90/ay)
- Ansible 2.16+
- SSH key tabanlı root erişimi tüm node'lara

## Kurulum

```bash
# 1. inventory'yi düzenle (gerçek IP'leri ve token'ı koy)
cp inventory.example.yml inventory.yml
vim inventory.yml

# 2. K3s + base platform bileşenlerini kur
ansible-playbook -i inventory.yml k3s-bootstrap.yml

# 3. kubeconfig host'una indirilir; ortam değişkenini ayarla
export KUBECONFIG=$(pwd)/kubeconfig.yaml
kubectl get nodes

# 4. ArgoCD'ye uygulamaları deploy et (Faz 0 sonrası)
kubectl apply -f ../argocd/root-application.yaml
```

## Playbook'ün Yaptıkları

1. Tüm node'larda base paketler (curl, ufw, open-iscsi for Longhorn) yükler.
2. Master'a K3s server kurar (Traefik ve servicelb disable — yerine helm ile yönetilir).
3. Worker'lara K3s agent kurar.
4. Master'a Helm yükler ve aşağıdaki bileşenleri Helm ile install eder:
   - **cert-manager** — TLS sertifikaları (Let's Encrypt)
   - **Traefik** — Ingress controller
   - **Longhorn** — Distributed block storage (replica 2)
   - **kube-prometheus-stack** — Prometheus + Grafana + Alertmanager
   - **Loki + Promtail** — Log aggregation
   - **Tempo** — Distributed tracing
   - **ArgoCD** — GitOps controller
   - **RabbitMQ, Redis, PostgreSQL, MinIO, Elasticsearch** — DijitalAtölye bağımlılıkları (`dijitalatolye` namespace)

## Sonraki Adımlar

- **Cloudflare DNS** — `*.dijitalatolye.tr` → cluster ingress IP
- **ClusterIssuer** (cert-manager) — Let's Encrypt prod issuer
- **Sealed Secrets** veya **External Secrets + Vault** — secret yönetimi
- **Velero** — backup (S3 / MinIO)
- **ArgoCD Application'ları** — `deploy/argocd/applications/*.yaml`

## Production Hardening (Faz 4)

- 3 master node (etcd HA quorum için)
- Network Policies (Calico)
- mTLS (Linkerd veya Istio — ADR'da netleştir)
- Image scan (Trivy operator)
- OPA Gatekeeper (policy enforcement)
- Pod Security Standards (restricted)
