// k6 yuk testi: Identity login endpointi icin baseline.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const USERS = JSON.parse(open('./users.json'));

export const options = {
  vus: 50,
  duration: '2m',
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const u = USERS[Math.floor(Math.random() * USERS.length)];
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: u.email, password: u.password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, { '200 OK': (r) => r.status === 200 });
  sleep(1);
}
