# DijitalAtolye E2E Tests (Playwright)

Bu klasor Playwright ile uctan-uca testleri icerir. Vertical slice'in akisini
otomatik dogrulamak icin kullanilir.

## Kurulum

```bash
cd tests/e2e
npm install
npx playwright install --with-deps chromium
```

## Calistirma

Ondegen olarak uygulama `http://localhost:5173`'te beklenir. `BASE_URL`
ortam degiskeni ile degistirilebilir.

```bash
# Tum servisler ve frontend ayaktayken:
make dev   # repo kokunden, opsiyonel
npm test
```

## CI

| Job | Ne yapar |
|-----|----------|
| `e2e` | Statik smoke: Vite preview, API olmadan UI testleri |
| `e2e-vertical-slice` | Canli API: Docker infra + Identity/Content/Search/Gateway + fixture seed + Playwright |

Vertical slice job'u repo kokunden calistirir:

```bash
chmod +x scripts/ci/*.sh
./scripts/ci/run-e2e-vertical-slice.sh
```

Ortam degiskenleri: `E2E_LIVE_API=true`, `E2E_AUTH_TOKEN`, `E2E_EXPECT_SLUG=e2e-demo-matematik`.
