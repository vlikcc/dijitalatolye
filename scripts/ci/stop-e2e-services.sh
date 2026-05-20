#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PID_FILE="${PID_FILE:-$ROOT/.ci-e2e-pids}"

if [[ -f "$PID_FILE" ]]; then
  while read -r pid; do
    [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true
  done <"$PID_FILE"
  rm -f "$PID_FILE"
fi

pkill -f "DijitalAtolye.Identity.API" 2>/dev/null || true
pkill -f "DijitalAtolye.Content.API" 2>/dev/null || true
pkill -f "DijitalAtolye.Search.API" 2>/dev/null || true
pkill -f "DijitalAtolye.ApiGateway" 2>/dev/null || true

echo "E2E servisleri durduruldu."
