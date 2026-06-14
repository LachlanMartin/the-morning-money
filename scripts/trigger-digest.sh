#!/usr/bin/env bash
set -euo pipefail

SECRET="${CRON_SECRET:-$(grep CRON_SECRET .env | cut -d= -f2)}"
if [ -z "$SECRET" ]; then
  echo "Error: CRON_SECRET not set in .env"
  exit 1
fi

curl -s "http://localhost:3000/api/cron/daily-digest" \
  -H "Authorization: Bearer $SECRET" | jq .
