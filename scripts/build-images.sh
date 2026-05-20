#!/usr/bin/env bash
# Tum servisler icin Docker image build et.
#   ./scripts/build-images.sh                          # tum servisleri
#   ./scripts/build-images.sh identity content         # belirli servisleri
#   TAG=v0.2.0 ./scripts/build-images.sh               # tag override

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REGISTRY="${REGISTRY:-ghcr.io/dijitalatolye}"
TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || echo dev)}"

ALL_SERVICES=(
  "apigateway:src/ApiGateway"
  "identity:src/Services/Identity/Identity.API"
  "user:src/Services/User/User.API"
  "catalog:src/Services/Catalog/Catalog.API"
  "storage:src/Services/Storage/Storage.API"
  "content:src/Services/Content/Content.API"
  "aimoderation:src/Services/AIModeration/AIModeration.API"
  "review:src/Services/Review/Review.API"
  "notification:src/Services/Notification/Notification.API"
  "search:src/Services/Search/Search.API"
  "analytics:src/Services/Analytics/Analytics.API"
  "admin:src/Services/Admin/Admin.API"
  "web:src/Web/dijitalatolye-web"
)

BUILD_LIST=()
if [ "$#" -eq 0 ]; then
  BUILD_LIST=("${ALL_SERVICES[@]}")
else
  for arg in "$@"; do
    for entry in "${ALL_SERVICES[@]}"; do
      if [[ "${entry%%:*}" == "$arg" ]]; then
        BUILD_LIST+=("$entry")
      fi
    done
  done
fi

if [ "${#BUILD_LIST[@]}" -eq 0 ]; then
  echo "No matching services. Available:"
  for e in "${ALL_SERVICES[@]}"; do echo "  - ${e%%:*}"; done
  exit 1
fi

for entry in "${BUILD_LIST[@]}"; do
  name="${entry%%:*}"
  path="${entry#*:}"
  image="${REGISTRY}/dijitalatolye-${name}:${TAG}"
  echo ""
  if [[ "$name" == "web" ]]; then
    echo "==> Building $image (context=${path}, dockerfile=Dockerfile)"
    docker build \
      -t "$image" \
      -t "${REGISTRY}/dijitalatolye-${name}:latest" \
      -f "${path}/Dockerfile" \
      "${path}"
  else
    echo "==> Building $image (context=., dockerfile=${path}/Dockerfile)"
    docker build \
      -t "$image" \
      -t "${REGISTRY}/dijitalatolye-${name}:latest" \
      -f "${path}/Dockerfile" \
      .
  fi
done

echo ""
echo "Done. Tagged with: $TAG and latest"
