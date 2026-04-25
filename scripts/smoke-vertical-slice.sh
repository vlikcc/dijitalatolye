#!/usr/bin/env bash
# Vertical slice uctan uca smoke test (Faz 1 milestone).
# Gereksinimler: curl, jq, bir HTML5 oyun ZIP dosyasi (./demo-content.zip)

set -euo pipefail

GATEWAY="${GATEWAY:-http://localhost:5000/api}"
EMAIL="${EMAIL:-teacher+demo@example.com}"
PASSWORD="${PASSWORD:-Passw0rd!}"
ZIP_PATH="${ZIP_PATH:-./demo-content.zip}"

if [[ ! -f "$ZIP_PATH" ]]; then
  echo "ZIP bulunamadi: $ZIP_PATH" >&2
  exit 1
fi

echo "==> 1. Register / Login"
curl -sS -X POST "$GATEWAY/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"role\":\"Teacher\"}" || true

LOGIN=$(curl -sS -X POST "$GATEWAY/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$LOGIN" | jq -r '.accessToken')
echo "Token: ${TOKEN:0:32}..."

echo "==> 2. Content olustur"
CONTENT=$(curl -sS -X POST "$GATEWAY/contents" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "title":"Demo Oyun",
    "description":"Vertical slice test",
    "subject":"Matematik",
    "gradeLevel":4,
    "outcomeCodes":["M.4.1.1.1"],
    "tags":["demo"]
  }')
CONTENT_ID=$(echo "$CONTENT" | jq -r '.id')
echo "ContentId: $CONTENT_ID"

echo "==> 3. Storage presigned URL al"
PRESIGNED=$(curl -sS -X POST "$GATEWAY/storage/uploads/presigned" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"contentId\":\"$CONTENT_ID\",\"purpose\":\"content\",\"contentType\":\"application/zip\",\"sizeBytes\":$(stat -f%z "$ZIP_PATH")}")
UPLOAD_URL=$(echo "$PRESIGNED" | jq -r '.uploadUrl')
OBJECT_KEY=$(echo "$PRESIGNED" | jq -r '.objectKey')
BUCKET=$(echo "$PRESIGNED" | jq -r '.bucket')

echo "==> 4. MinIO'ya upload"
curl -sS -X PUT --data-binary "@$ZIP_PATH" -H 'Content-Type: application/zip' "$UPLOAD_URL" >/dev/null

echo "==> 5. Version kaydet"
VERSION=$(curl -sS -X POST "$GATEWAY/contents/$CONTENT_ID/versions" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"storageBucket\":\"$BUCKET\",
    \"storageKey\":\"$OBJECT_KEY\",
    \"manifestEntry\":\"index.html\",
    \"fileSizeBytes\":$(stat -f%z "$ZIP_PATH"),
    \"sha256\":\"$(shasum -a 256 "$ZIP_PATH" | awk '{print $1}')\",
    \"changeLog\":\"initial\"
  }")
echo "Version: $(echo "$VERSION" | jq -r '.versionNumber')"

echo "==> 6. Submit (AI moderation tetikler)"
curl -sS -X POST "$GATEWAY/contents/$CONTENT_ID/submit" \
  -H "Authorization: Bearer $TOKEN" >/dev/null
echo "Submitted. AI Moderation 30-60sn icinde rapor olusturmali."

echo "==> 7. Review queue izle"
echo "Manual: GET $GATEWAY/review/queue (Editor JWT ile)"
echo "ContentId: $CONTENT_ID"
