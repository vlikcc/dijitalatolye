# DijitalAtolye Load Tests (k6)

Yuk testleri [k6](https://k6.io/) ile yapılır. Hedefler PRD'de tanımlı:
- Kesif/arama p95 < 600ms, hata < %1
- Login p95 < 800ms, hata < %2
- 200 esz. kullanici, 5 dakika

## Calistirma

```bash
brew install k6
cd tests/load/k6
BASE_URL=http://localhost:5000 k6 run scenarios/discover.js
BASE_URL=http://localhost:5000 k6 run scenarios/auth.js
```

## Kapali Beta Once Yapilacaklar

- Staging URL'ine karsi `discover.js` ile soak test (1 saat).
- Auth uclarinda rate limiter dogrulamasi (`429 Too Many Requests` kontrolu).
- Sonuclari Grafana k6 dashboard'una gonder (`-o influxdb`).
