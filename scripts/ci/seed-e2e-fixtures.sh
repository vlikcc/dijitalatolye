#!/usr/bin/env bash
# Gateway + Identity + Search ayaktayken ES ve auth fixture seed eder.
set -euo pipefail

GATEWAY="${GATEWAY:-http://localhost:5000/api}"
ES_URI="${ES_URI:-http://localhost:9200}"
INDEX="${INDEX:-contents-tr}"
EMAIL="${E2E_EMAIL:-e2e-ci-teacher@meb.k12.tr}"
PASSWORD="${E2E_PASSWORD:-Test1234!Aa}"
CONTENT_ID="${E2E_CONTENT_ID:-11111111-1111-4111-8111-111111111111}"
SLUG="${E2E_SLUG:-e2e-demo-matematik}"

echo "==> ES indeks: $INDEX"
curl -fsS -X PUT "$ES_URI/$INDEX" -H 'Content-Type: application/json' -d '{
  "settings": {
    "analysis": {
      "analyzer": {
        "turkish_folded": {
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "slug": { "type": "keyword" },
      "title": { "type": "text", "analyzer": "turkish_folded" },
      "description": { "type": "text", "analyzer": "turkish_folded" },
      "subject": { "type": "keyword" },
      "gradeLevel": { "type": "integer" },
      "outcomeCodes": { "type": "keyword" },
      "tags": { "type": "keyword" },
      "authorName": { "type": "keyword" },
      "publishedAt": { "type": "date" },
      "views": { "type": "integer" },
      "likes": { "type": "integer" },
      "popularity": { "type": "double" }
    }
  }
}' >/dev/null 2>&1 || true

PUBLISHED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
curl -fsS -X PUT "$ES_URI/$INDEX/_doc/$CONTENT_ID" -H 'Content-Type: application/json' -d "$(jq -n \
  --arg id "$CONTENT_ID" \
  --arg slug "$SLUG" \
  --arg publishedAt "$PUBLISHED_AT" \
  '{
    id: $id,
    contentId: $id,
    title: "E2E Demo Matematik",
    description: "CI vertical slice fixture",
    slug: $slug,
    subject: "Matematik",
    gradeLevel: 4,
    outcomeCodes: ["M.4.1.1.1"],
    tags: ["e2e","demo"],
    authorName: "E2E CI",
    publishedAt: $publishedAt,
    views: 1,
    likes: 0,
    popularity: 0.5
  }')"
echo "ES dokuman seed: slug=$SLUG"

echo "==> Auth kullanici"
curl -fsS -X POST "$GATEWAY/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"displayName\":\"E2E CI\",\"role\":\"Teacher\"}" \
  >/dev/null 2>&1 || true

LOGIN="$(curl -fsS -X POST "$GATEWAY/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")"

TOKEN="$(echo "$LOGIN" | jq -r '.accessToken // .AccessToken // empty')"
if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "Login basarisiz: $LOGIN" >&2
  exit 1
fi

echo "$TOKEN" > "${E2E_TOKEN_FILE:-/tmp/e2e-auth-token.txt}"
echo "Auth token yazildi: ${E2E_TOKEN_FILE:-/tmp/e2e-auth-token.txt}"

# Discover aramasinda bulunabilirlik icin refresh (ES 9)
curl -fsS -X POST "$ES_URI/$INDEX/_refresh" >/dev/null 2>&1 || true

echo "Seed tamam."
