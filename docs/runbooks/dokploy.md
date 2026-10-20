# Dokploy ile Canlıya Alma

Dokploy (Traefik) üzerinde tek compose uygulaması olarak çalışır. TLS'i Traefik sonlandırır; Caddy iç ağda
`:80` dinler ve `/api`, `/hubs`, `/cdn`, SPA yönlendirmesini + güvenlik başlıklarını yapar.

## Dosyalar

| Dosya | Açıklama |
|---|---|
| `deploy/docker-compose/docker-compose.dokploy.yml` | **Otomatik üretilir** — `python3 scripts/gen-dokploy-compose.py`. Kaynak: `docker-compose.prod.yml`. Prod compose'u değiştirdikten sonra yeniden üretip commit'leyin. |
| `deploy/docker-compose/caddy/Caddyfile.dokploy` | Traefik arkası Caddy girişi (`auto_https off`, `:80`). Site gövdesi `site.caddy` ile ortak. |
| `.env.dokploy` (git'e girmez) | Canlı ortam değişkenleri; Dokploy'da compose'un **Environment** sekmesine yapıştırılır. |

## Dokploy ayarları

- **Source:** Git — `https://github.com/vlikcc/dijitalatolye.git`, branch `main`
- **Compose path:** `./deploy/docker-compose/docker-compose.dokploy.yml`
- **Domain:** servis `caddy`, port `80`, HTTPS + Let's Encrypt
- **DNS:** alan adı için A kaydı → Dokploy sunucu IP'si (Cloudflare proxy açıksa SSL modu *Full*)

## Sürüm yükseltme / geri dönüş

İmajları GitHub Actions (`release.yml`) derleyip `ghcr.io/vlikcc/dijitalatolye-<servis>` altında `main`, `latest` ve
`sha-<commit>` etiketleriyle yayınlar. Sunucuda derleme yapılmaz.

**Otomatik deploy (varsayılan):** Dokploy ortamında `IMAGE_TAG=main`, Dokploy'un git otomatik deploy'u **kapalı**.
`main`'e her push'ta testler ve 13 imajın hepsi başarılıysa `release.yml` içindeki **Deploy (Dokploy)** işi Dokploy API'sini
çağırır, deployment'ın bitmesini bekler ve `/health`'i kontrol eder. Git otomatik deploy'u açık olursa Dokploy push anında,
imajlar daha derlenmeden deploy eder ve bir önceki sürümü çeker — açmayın. Etiket sabit (`main`) olduğundan
Dokploy compose'unda CI imajları `pull_policy: always` taşır (üretici script ekler); bu olmadan `compose up` yeni
imajı çekmez ve eski container'lar çalışmaya devam eder.

GitHub ayarları (Settings → Secrets and variables → Actions):

| Ad | Tür | Değer |
|---|---|---|
| `DOKPLOY_API_KEY` | secret | Dokploy → Settings → API keys |
| `DOKPLOY_URL` | variable | `https://dokploy.yargisalzeka.com` |
| `DOKPLOY_COMPOSE_ID` | variable | `dijitalatolye` compose'unun kimliği (`/api/project.all`) |
| `PUBLIC_URL` | variable (isteğe bağlı) | Sağlık kontrolü adresi; varsayılan `https://dijitalatolye.velikececi.com` |

Bunlardan biri eksikse deploy işi uyarı verip atlanır (imajlar yine yayınlanır).

**Geri dönüş:** Dokploy ortamında `IMAGE_TAG`'i önceki `sha-…` etiketine çekip **Deploy** edin. Sonraki `main` push'u
`IMAGE_TAG=main`'e dönülene kadar yine o sabit etiketi deploy eder; düzeltme yayınlanınca `IMAGE_TAG=main`'e geri alın.

## Erişim

- Guard yönetim paneli yalnızca sunucuda `127.0.0.1:18000` — `ssh -L 18000:127.0.0.1:18000 <sunucu>`.
- İlk admin: `.env.dokploy` içindeki `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.
- Migration'lar servis açılışında uygulanır (bkz. `selfhost-prod.md`).
