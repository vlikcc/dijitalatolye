#!/usr/bin/env bash
# EF Core komutlarini dogru proje / context / klasor eslemesiyle calistirir.
#   scripts/ef.sh add <Svc> <MigrationAdi>     # yeni migration
#   scripts/ef.sh check [<Svc>...]             # model ile son migration senkron mu (bos = hepsi)
# Svc: Identity User Catalog Content Review Notification Analytics Admin Audit
#
# DB'ye migration uygulamak icin servisi baslatin (MigrateDatabaseAsync eski DB'leri baseline'lar);
# ham 'dotnet ef database update' bu adimi atlar.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

ALL=(Identity User Catalog Content Review Notification Analytics Admin Audit)

project_args() {
  case "$1" in
    Identity) echo "--project src/Services/Identity/Identity.Infrastructure --startup-project src/Services/Identity/Identity.API --context IdentityDbContext" ;;
    Audit)    echo "--project src/BuildingBlocks/Audit --startup-project src/Services/Admin/Admin.API --context AuditDbContext" ;;
    User|Catalog|Content|Review|Notification|Analytics|Admin)
              echo "--project src/Services/$1/$1.API --startup-project src/Services/$1/$1.API --context $1DbContext" ;;
    *) echo "Bilinmeyen servis: $1 (gecerli: ${ALL[*]})" >&2; return 1 ;;
  esac
}

output_dir() { [ "$1" = "Audit" ] && echo "Migrations" || echo "Persistence/Migrations"; }

dotnet tool restore >/dev/null

cmd="${1:-}"; shift || true
case "$cmd" in
  add)
    [ $# -eq 2 ] || { echo "kullanim: scripts/ef.sh add <Svc> <MigrationAdi>" >&2; exit 1; }
    # shellcheck disable=SC2046
    dotnet tool run dotnet-ef migrations add "$2" $(project_args "$1") --output-dir "$(output_dir "$1")"
    ;;
  check)
    targets=("$@"); [ ${#targets[@]} -eq 0 ] && targets=("${ALL[@]}")
    for svc in "${targets[@]}"; do
      echo ">>> $svc"
      # shellcheck disable=SC2046
      dotnet tool run dotnet-ef migrations has-pending-model-changes $(project_args "$svc")
    done
    ;;
  *)
    sed -n '2,8p' "$0"; exit 1 ;;
esac
