#!/usr/bin/env bash
# DijitalAtolye - Production stack backup
# Postgres (tum DB'ler), Guard Postgres, Mongo (aimoderation), MinIO (tum bucket'lar)
# ve Guard veri volume'u (guard-data) yedekler. Herhangi bir adim basarisiz olursa
# script hata koduyla cikar (set -euo pipefail) — cron loglarini izleyin.
# Geri yukleme: ./scripts/prod-restore.sh <yedek-dizini>
#
# Kullanim:
#   ./scripts/prod-backup.sh                       # ./backups/<timestamp>/ altina yazar
#   BACKUP_DIR=/var/backups ./scripts/prod-backup.sh
#
# Cron ornegi (gunluk 03:00):
#   0 3 * * * cd /opt/dijitalatolye && BACKUP_DIR=/var/backups/dijitalatolye ./scripts/prod-backup.sh >> /var/log/da-backup.log 2>&1
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env.prod}"
COMPOSE_FILE="$REPO_ROOT/deploy/docker-compose/docker-compose.prod.yml"
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups}"
TS="$(date +%Y%m%d-%H%M%S)"
DEST="$BACKUP_DIR/$TS"
RETAIN_DAYS="${RETAIN_DAYS:-14}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "HATA: $ENV_FILE bulunamadi." >&2
  exit 1
fi

# .env.prod'dan kullanici/sifre yukle
set -a; . "$ENV_FILE"; set +a

DC=(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE")
PROJECT="${COMPOSE_PROJECT_NAME:-dijitalatolye-prod}"
# guard-data volume'unu okumak icin tar iceren hafif imaj (guard-postgres ile ayni imaj, zaten cekili)
HELPER_IMAGE="${HELPER_IMAGE:-postgres:16-alpine}"

mkdir -p "$DEST"
echo ">>> Backup hedef: $DEST"

# --- Postgres (her DB ayri ayri pg_dump) ---
echo ">>> Postgres dump..."
DBS=(identity user catalog content review notification analytics audit)
for db in "${DBS[@]}"; do
  echo "    - $db"
  "${DC[@]}" exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$db" --format=custom --no-owner \
    > "$DEST/pg-$db.dump"
done

# --- Guard Postgres ---
echo ">>> Guard Postgres dump..."
"${DC[@]}" exec -T guard-postgres pg_dump -U guard -d guard --format=custom --no-owner \
  > "$DEST/guard-pg.dump"

# --- MongoDB ---
echo ">>> MongoDB dump..."
"${DC[@]}" exec -T mongodb mongodump \
  --username "${MONGO_USER:-dijitalatolye}" --password "$MONGO_PASSWORD" \
  --authenticationDatabase admin --db ai_moderation --archive --gzip \
  > "$DEST/mongo-ai_moderation.archive.gz"

# --- MinIO (mirror tum public/private bucket'lar) ---
# mc imajinda tar yok; bucket'lar host'taki gecici dizine mirror'lanir, tar host'ta yapilir.
# Hata yutulmaz: mirror basarisizsa script durur.
echo ">>> MinIO mirror..."
mkdir -p "$DEST/minio"
# Host kullanicisi ile calistir: olusan dosyalar root'a ait olmasin (rm -rf calissin)
"${DC[@]}" run --rm --no-deps -T --user "$(id -u):$(id -g)" -e MC_CONFIG_DIR=/tmp/.mc \
  -v "$DEST/minio:/backup" --entrypoint /bin/sh minio-init -c "
  set -e
  mc alias set local http://minio:9000 \"\$MINIO_ROOT_USER\" \"\$MINIO_ROOT_PASSWORD\" >/dev/null
  for b in ${MINIO_BUCKET_CONTENT:-dijitalatolye-content} ${MINIO_BUCKET_PUBLISHED:-dijitalatolye-content-published} ${MINIO_BUCKET_AVATARS:-dijitalatolye-avatars}; do
    mkdir -p /backup/\$b
    mc mirror --quiet --overwrite local/\$b /backup/\$b
  done
"
tar -C "$DEST/minio" -czf "$DEST/minio.tar.gz" .
rm -rf "$DEST/minio"

# --- Guard veri volume'u (karantina/temiz dosyalar) ---
echo ">>> Guard data volume..."
GUARD_VOL="$(docker volume ls -q \
  --filter "label=com.docker.compose.project=$PROJECT" \
  --filter "label=com.docker.compose.volume=guard-data")"
if [[ -z "$GUARD_VOL" ]]; then
  echo "HATA: guard-data volume'u bulunamadi (proje: $PROJECT)." >&2
  exit 1
fi
docker run --rm -v "$GUARD_VOL:/data:ro" --entrypoint tar "$HELPER_IMAGE" -C /data -czf - . \
  > "$DEST/guard-data.tar.gz"

# --- Imzala ve sikistir ---
echo ">>> Boyutlar:"
du -h "$DEST"/* | sed 's/^/    /'

# --- Eski yedekleri temizle ---
if [[ -d "$BACKUP_DIR" ]]; then
  echo ">>> $RETAIN_DAYS gunden eski yedekleri sil..."
  find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime "+$RETAIN_DAYS" -print -exec rm -rf {} +
fi

echo ">>> Backup tamamlandi: $DEST"
