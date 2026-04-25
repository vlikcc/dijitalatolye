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

GitHub Actions `pr.yml` icinde `e2e` job'u olarak kosulur (servisler bagli
oldugundan smoke modunda, baseUrl staging URL'ine isaret eder).
