#!/usr/bin/env bash
# DijitalAtolye - Production stack geri yukleme (prod-backup.sh ciktisindan)
# Postgres (tum DB'ler + Guard DB), Mongo (ai_moderation), MinIO bucket'lari ve
# (varsa) Guard veri volume'unu geri yukler.
#
# Kullanim:
#   ./scripts/prod-restore.sh backups/20260101-030000
#   ./scripts/prod-restore.sh /var/backups/dijitalatolye/20260101-030000
#   SKIP_MINIO=1 ./scripts/prod-restore.sh <dizin>      # MinIO adimini atla
#   ASSUME_YES=1 ./scripts/prod-restore.sh <dizin>      # onay sormadan (DIKKAT)
#
# Ne yapar:
#   1) Uygulama + Guard servislerini durdurur (veri servisleri ACIK kalir)
#   2) Postgres DB'lerini --clean ile geri yukler (mevcut tablolar silinir!)
#   3) Mongo ai_moderation'i --drop ile geri yukler
#   4) MinIO bucket'larini mirror --overwrite ile geri yukler (yedekte olmayan nesneler silinmez)
#   5) guard-data volume'unu temizleyip geri yukler
#   6) Durdurulan servisleri yeniden baslatir
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env.prod}"
COMPOSE_FILE="$REPO_ROOT/deploy/docker-compose/docker-compose.prod.yml"
PROJECT="${COMPOSE_PROJECT_NAME:-dijitalatolye-prod}"
HELPER_IMAGE="${HELPER_IMAGE:-postgres:16-alpine}"

SRC="${1:-}"
if [[ -z "$SRC" || ! -d "$SRC" ]]; then
  echo "Kullanim: $0 <yedek-dizini>   (ornek: backups/20260101-030000)" >&2
  exit 1
fi
SRC="$(cd "$SRC" && pwd)"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "HATA: $ENV_FILE bulunamadi." >&2
  exit 1
fi

# .env.prod'dan kullanici/sifre yukle
set -a; . "$ENV_FILE"; set +a

DC=(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE")

PG_DBS=(identity user catalog content review notification analytics audit)
APP_SERVICES=(gateway web identity user catalog storage content aimoderation review notification analytics search admin)
GUARD_SERVICES=(guard-nginx guard-web guard-worker-scan guard-worker-delivery guard-beat)

# --- On kontrol: yedek dosyalari ---
missing=0
for db in "${PG_DBS[@]}"; do
  [[ -f "$SRC/pg-$db.dump" ]] || { echo "EKSIK: $SRC/pg-$db.dump" >&2; missing=1; }
done
[[ -f "$SRC/mongo-ai_moderation.archive.gz" ]] || { echo "EKSIK: mongo-ai_moderation.archive.gz" >&2; missing=1; }
if [[ -z "${SKIP_MINIO:-}" ]]; then
  [[ -f "$SRC/minio.tar.gz" ]] || { echo "EKSIK: minio.tar.gz (SKIP_MINIO=1 ile atlanabilir)" >&2; missing=1; }
fi
if [[ "$missing" -ne 0 ]]; then
  echo "HATA: Yedek eksik; geri yukleme yapilmadi." >&2
  exit 1
fi

echo "=================================================================="
echo " GERI YUKLEME: $SRC"
echo " Hedef proje:  $PROJECT"
echo " Mevcut Postgres/Mongo verisi bu yedekle DEGISTIRILECEK."
echo " Uygulama ve Guard servisleri islem boyunca DURDURULACAK."
echo "=================================================================="
if [[ -z "${ASSUME_YES:-}" ]]; then
  read -r -p "Devam etmek icin 'evet' yazin: " ans
  [[ "$ans" == "evet" ]] || { echo "Iptal edildi."; exit 1; }
fi

echo ">>> Uygulama ve Guard servisleri durduruluyor..."
"${DC[@]}" stop "${APP_SERVICES[@]}" "${GUARD_SERVICES[@]}"

# Hata olursa servisleri yine de geri baslat
restart_services() {
  echo ">>> Servisler yeniden baslatiliyor..."
  "${DC[@]}" start "${GUARD_SERVICES[@]}" "${APP_SERVICES[@]}" || true
}
trap restart_services EXIT

# --- Postgres ---
echo ">>> Postgres restore..."
for db in "${PG_DBS[@]}"; do
  echo "    - $db"
  "${DC[@]}" exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$db" \
    --clean --if-exists --no-owner --no-privileges < "$SRC/pg-$db.dump"
done

# --- Guard Postgres ---
if [[ -f "$SRC/guard-pg.dump" ]]; then
  echo ">>> Guard Postgres restore..."
  "${DC[@]}" exec -T guard-postgres pg_restore -U guard -d guard \
    --clean --if-exists --no-owner --no-privileges < "$SRC/guard-pg.dump"
else
  echo ">>> (guard-pg.dump yok — Guard DB atlandi)"
fi

# --- MongoDB ---
echo ">>> MongoDB restore..."
"${DC[@]}" exec -T mongodb mongorestore \
  --username "${MONGO_USER:-dijitalatolye}" --password "$MONGO_PASSWORD" \
  --authenticationDatabase admin --archive --gzip --drop \
  --nsInclude 'ai_moderation.*' < "$SRC/mongo-ai_moderation.archive.gz"

# --- MinIO ---
if [[ -z "${SKIP_MINIO:-}" ]]; then
  echo ">>> MinIO restore..."
  WORK="$(mktemp -d "${TMPDIR:-/tmp}/da-minio-restore.XXXXXX")"
  tar -xzf "$SRC/minio.tar.gz" -C "$WORK"
  "${DC[@]}" run --rm --no-deps -T --user "$(id -u):$(id -g)" -e MC_CONFIG_DIR=/tmp/.mc \
    -v "$WORK:/restore:ro" --entrypoint /bin/sh minio-init -c "
    set -e
    mc alias set local http://minio:9000 \"\$MINIO_ROOT_USER\" \"\$MINIO_ROOT_PASSWORD\" >/dev/null
    for dir in /restore/*/; do
      [ -d \"\$dir\" ] || continue
      b=\$(basename \"\$dir\")
      echo \"    - \$b\"
      mc mb -p local/\$b >/dev/null
      mc mirror --quiet --overwrite \"\$dir\" local/\$b
    done
    # Yayinlanan icerik bucket'i public-read olmali (/cdn/* bunu bekler)
    mc anonymous set download local/${MINIO_BUCKET_PUBLISHED:-dijitalatolye-content-published} >/dev/null
  "
  rm -rf "$WORK"
else
  echo ">>> (SKIP_MINIO=1 — MinIO atlandi)"
fi

# --- Guard veri volume'u ---
if [[ -f "$SRC/guard-data.tar.gz" ]]; then
  echo ">>> Guard data volume restore..."
  GUARD_VOL="$(docker volume ls -q \
    --filter "label=com.docker.compose.project=$PROJECT" \
    --filter "label=com.docker.compose.volume=guard-data")"
  if [[ -z "$GUARD_VOL" ]]; then
    echo "HATA: guard-data volume'u bulunamadi (proje: $PROJECT)." >&2
    exit 1
  fi
  docker run --rm -i -v "$GUARD_VOL:/data" --entrypoint /bin/sh "$HELPER_IMAGE" -c \
    'set -e; find /data -mindepth 1 -delete; tar -C /data -xzf -' < "$SRC/guard-data.tar.gz"
else
  echo ">>> (guard-data.tar.gz yok — Guard volume atlandi)"
fi

echo ">>> Geri yukleme tamamlandi: $SRC"
echo "    Kontrol: make prod-ps && make prod-smoke"
