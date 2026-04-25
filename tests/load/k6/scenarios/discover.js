// k6 yuk testi: kesif/arama uclari icin baseline.
// Calistirma: BASE_URL=http://localhost:5000 k6 run scenarios/discover.js
//
// Hedef: Sayfa basina p95 < 600ms, hata orani < %1, 200 sanal kullanici, 5 dakika.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  scenarios: {
    browse: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '2m', target: 200 },
        { duration: '2m', target: 200 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<600'],
  },
};

const QUERIES = ['matematik', 'fen', 'tarih', 'kesir', 'gunes sistemi', ''];

export default function () {
  const q = QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const url = `${BASE_URL}/api/search/contents?q=${encodeURIComponent(q)}&page=1&pageSize=20`;
  const res = http.get(url, { tags: { endpoint: 'search' } });
  check(res, {
    '200 OK': (r) => r.status === 200,
    'has body': (r) => r.body && r.body.length > 0,
  });
  sleep(Math.random() * 2 + 1);
}
