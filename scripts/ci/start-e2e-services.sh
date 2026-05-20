#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PID_FILE="${PID_FILE:-$ROOT/.ci-e2e-pids}"
LOG_DIR="${LOG_DIR:-$ROOT/.ci-e2e-logs}"
mkdir -p "$LOG_DIR"
: >"$PID_FILE"

CI_SECRET="${CI_SECRET:-ci-e2e-secret-min-32-chars-long!!}"
JWT_KEY="${JWT_KEY:-ci-e2e-jwt-signing-key-32chars-min!!}"

export_common() {
  export ASPNETCORE_ENVIRONMENT=Development
  export Database__AutoMigrate=true
  export ConnectionStrings__Postgres="Host=127.0.0.1;Port=5432;Database=$1;Username=dijitalatolye;Password=$CI_SECRET"
  export RabbitMq__Host=localhost
  export RabbitMq__Port=5672
  export RabbitMq__Username=dijitalatolye
  export RabbitMq__Password="$CI_SECRET"
  export JwtIssuer__SigningKey="$JWT_KEY"
  export JwtIssuer__Authority=http://localhost:5001
  export JwtIssuer__Audience=dijitalatolye-api
  export Jwt__Authority=http://localhost:5001
  export Jwt__Audience=dijitalatolye-api
  export Jwt__RequireHttpsMetadata=false
  export Elasticsearch__Uri=http://localhost:9200
}

start_svc() {
  local name="$1"
  local project="$2"
  local db="$3"
  export_common "$db"
  echo "Baslatiliyor: $name"
  dotnet run --project "$ROOT/$project" -c Release --no-build \
    >"$LOG_DIR/$name.log" 2>&1 &
  echo $! >>"$PID_FILE"
}

cd "$ROOT"
dotnet build DijitalAtolye.sln -c Release -v q

start_svc identity src/Services/Identity/Identity.API/Identity.API.csproj identity
sleep 3
start_svc content src/Services/Content/Content.API/Content.API.csproj content
start_svc search src/Services/Search/Search.API/Search.API.csproj content
start_svc gateway src/ApiGateway/ApiGateway.csproj identity

echo "Servis PID dosyasi: $PID_FILE"
