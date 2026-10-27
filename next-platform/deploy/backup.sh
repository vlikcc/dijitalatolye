#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${DEPLOY_COMPOSE:?Absolute compose file path required}"
: "${BACKUP_STAGING:?Private staging directory required}"
: "${RESTIC_REPOSITORY:?Off-server Restic repository required}"
: "${RESTIC_PASSWORD_FILE:?Restic password file required}"
command -v restic >/dev/null
mkdir -p "$BACKUP_STAGING"
chmod 700 "$BACKUP_STAGING"
snapshot_dir=$(mktemp -d "$BACKUP_STAGING/dijital-XXXXXXXX")
compose=(docker compose -f "$DEPLOY_COMPOSE")
resume(){ "${compose[@]}" start web worker >/dev/null; }
trap resume EXIT
"${compose[@]}" stop worker web
"${compose[@]}" exec -T postgres pg_dump -U app -d dijital -Fc > "$snapshot_dir/database.dump"
"${compose[@]}" run --rm --no-deps -T worker tar -C /data -cf - quarantine ready published > "$snapshot_dir/content.tar"
"${compose[@]}" run --rm --no-deps -T --entrypoint tar web -C /data -cf - thumbnails curriculum-sources cover-inputs > "$snapshot_dir/thumbnails.tar"
"${compose[@]}" images --format json > "$snapshot_dir/images.json"
(cd "$snapshot_dir" && sha256sum database.dump content.tar thumbnails.tar > SHA256SUMS)
resume
trap - EXIT
restic backup "$snapshot_dir" --tag dijitalatolye
printf 'Backup completed. Private staging retained at %s\n' "$snapshot_dir"
