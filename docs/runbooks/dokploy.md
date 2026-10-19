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

İmajları GitHub Actions (`release.yml`) derleyip `ghcr.io/vlikcc/dijitalatolye-<servis>:sha-<commit>` olarak yayınlar.
Dokploy ortamında `IMAGE_TAG`'i yeni `sha-…` etiketine çekip **Deploy** edin; geri dönmek için önceki etikete çekin.
Sunucuda derleme yapılmaz.

## Erişim

- Guard yönetim paneli yalnızca sunucuda `127.0.0.1:18000` — `ssh -L 18000:127.0.0.1:18000 <sunucu>`.
- İlk admin: `.env.dokploy` içindeki `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.
- Migration'lar servis açılışında uygulanır (bkz. `selfhost-prod.md`).
