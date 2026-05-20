#!/usr/bin/env bash
# Kullanim: wait-for-url.sh <url> [max_attempts] [sleep_seconds]
set -euo pipefail

URL="${1:?URL required}"
MAX="${2:-60}"
SLEEP="${3:-2}"

for ((i = 1; i <= MAX; i++)); do
  if curl -fsS "$URL" >/dev/null 2>&1; then
    echo "OK: $URL"
    exit 0
  fi
  echo "Bekleniyor ($i/$MAX): $URL"
  sleep "$SLEEP"
done

echo "Zaman asimi: $URL" >&2
exit 1
