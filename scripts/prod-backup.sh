#!/usr/bin/env bash
# DijitalAtolye - Production stack backup
# Postgres (tum DB'ler), Mongo (aimoderation), MinIO (tum bucket'lar) yedekler.
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

# --- MongoDB ---
echo ">>> MongoDB dump..."
"${DC[@]}" exec -T mongodb mongodump \
  --username "${MONGO_USER:-dijitalatolye}" --password "$MONGO_PASSWORD" \
  --authenticationDatabase admin --db ai_moderation --archive --gzip \
  > "$DEST/mongo-ai_moderation.archive.gz"

# --- MinIO (mirror tum public/private bucket'lar) ---
echo ">>> MinIO mirror..."
mkdir -p "$DEST/minio"
"${DC[@]}" run --rm --no-deps --entrypoint /bin/sh -T minio-init -c "
  mc alias set local http://minio:9000 \"\$MINIO_ROOT_USER\" \"\$MINIO_ROOT_PASSWORD\" >/dev/null
  for b in ${MINIO_BUCKET_CONTENT:-dijitalatolye-content} ${MINIO_BUCKET_PUBLISHED:-dijitalatolye-content-published} ${MINIO_BUCKET_AVATARS:-dijitalatolye-avatars}; do
    mc mirror --quiet --overwrite local/\$b /tmp/out/\$b || true
  done
  tar -C /tmp/out -czf /tmp/minio.tar.gz . 2>/dev/null
  cat /tmp/minio.tar.gz
" > "$DEST/minio.tar.gz" || echo "UYARI: MinIO yedegi basarisiz (bucket bos olabilir)"

# --- Imzala ve sikistir ---
echo ">>> Boyutlar:"
du -h "$DEST"/* | sed 's/^/    /'

# --- Eski yedekleri temizle ---
if [[ -d "$BACKUP_DIR" ]]; then
  echo ">>> $RETAIN_DAYS gunden eski yedekleri sil..."
  find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime "+$RETAIN_DAYS" -print -exec rm -rf {} +
fi

echo ">>> Backup tamamlandi: $DEST"
