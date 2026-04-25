# Helm Chart'ları

Her servis kendi chart'ına sahip. `_template/` klasörü reuse edilebilir base şablon, gerçek servis chart'ları kendi `values.yaml` ile bunu override eder.

## Klasör Yapısı

```
deploy/helm/
├── _template/        # Base chart (deployment, service, ingress, hpa, pdb, servicemonitor)
├── identity/
├── user/
├── catalog/
├── storage/
├── content/
├── aimoderation/
├── review/
├── notification/
├── search/
├── analytics/
├── apigateway/
└── web/
```

> Faz 0'da sadece `_template/` ve `identity/` örneği oluşturuldu. Diğer servisler oluşturuldukça `cp -R _template/templates <svc>/templates && create Chart.yaml & values.yaml` örüntüsü ile eklenir.

## Lokal Test

```bash
helm lint deploy/helm/identity/
helm template identity deploy/helm/identity/ --debug
helm install identity deploy/helm/identity/ --dry-run
```

## Deployment

```bash
helm upgrade --install identity deploy/helm/identity/ \
  --namespace dijitalatolye \
  --values deploy/helm/identity/values.yaml \
  --set image.tag=$(git rev-parse --short HEAD)
```

ArgoCD üzerinden GitOps:

```yaml
# deploy/argocd/applications/identity.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: identity
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/dijitalatolye/dijitalatolye
    path: deploy/helm/identity
    targetRevision: main
    helm:
      valueFiles:
        - values.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: dijitalatolye
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```
