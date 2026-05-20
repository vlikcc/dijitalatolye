#!/usr/bin/env bash
# Lokal veya CI: infra + minimal API + Playwright vertical slice (canli API).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

CI_SECRET="${CI_SECRET:-ci-e2e-secret-min-32-chars-long!!}"
COMPOSE="docker compose -f deploy/docker-compose/docker-compose.dev.yml"

cleanup() {
  "$ROOT/scripts/ci/stop-e2e-services.sh" || true
  if [[ "${KEEP_COMPOSE:-}" != "1" ]]; then
    $COMPOSE down -v >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "==> .env (CI)"
cat >.env <<EOF
POSTGRES_USER=dijitalatolye
COMPOSE_DEV_SECRET=$CI_SECRET
JWT_SIGNING_KEY=ci-e2e-jwt-signing-key-32chars-min!!
ASPNETCORE_ENVIRONMENT=Development
EOF

echo "==> Docker infra"
$COMPOSE up -d postgres rabbitmq redis elasticsearch minio
"$ROOT/scripts/ci/wait-for-url.sh" "http://localhost:9200" 40 3
"$ROOT/scripts/ci/wait-for-url.sh" "http://localhost:9000/minio/health/live" 30 2 || true

echo "==> .NET servisleri"
"$ROOT/scripts/ci/start-e2e-services.sh"
"$ROOT/scripts/ci/wait-for-url.sh" "http://localhost:5001/health/ready" 90 2
"$ROOT/scripts/ci/wait-for-url.sh" "http://localhost:5005/health/ready" 90 2
"$ROOT/scripts/ci/wait-for-url.sh" "http://localhost:5110/health/ready" 90 2
"$ROOT/scripts/ci/wait-for-url.sh" "http://localhost:5000/health/live" 60 2

echo "==> Fixture seed"
E2E_TOKEN_FILE=/tmp/e2e-auth-token.txt "$ROOT/scripts/ci/seed-e2e-fixtures.sh"

echo "==> Frontend build + preview"
cd src/Web/dijitalatolye-web
npm ci
npm run build
npx vite preview --host 127.0.0.1 --port 4173 >/tmp/vite-preview.log 2>&1 &
PREVIEW_PID=$!
sleep 4

echo "==> Playwright"
cd "$ROOT/tests/e2e"
npm ci
npx playwright install --with-deps chromium
export BASE_URL=http://127.0.0.1:4173
export API_BASE_URL=http://localhost:5000/api
export E2E_LIVE_API=true
export E2E_AUTH_TOKEN="$(cat /tmp/e2e-auth-token.txt)"
export E2E_EXPECT_SLUG=e2e-demo-matematik
npx playwright test specs/auth-live.spec.ts specs/vertical-slice.spec.ts

kill "$PREVIEW_PID" 2>/dev/null || true
echo "Vertical slice E2E tamamlandi."
