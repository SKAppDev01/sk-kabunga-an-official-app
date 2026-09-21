#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "FAIL: backend/.env is missing. Copy .env.example to .env and configure it first."
  exit 1
fi

value_for() {
  local key="$1"
  grep -E "^${key}=" .env | head -n1 | cut -d= -f2- || true
}

DATABASE_URL_VALUE="$(value_for DATABASE_URL)"
ACCESS_SECRET="$(value_for JWT_ACCESS_SECRET)"
REFRESH_SECRET="$(value_for JWT_REFRESH_SECRET)"
ADMIN_PASSWORD="$(value_for SEED_ADMIN_PASSWORD)"

status() {
  local label="$1"
  local ok="$2"
  if [ "$ok" = "1" ]; then
    echo "PASS: $label"
  else
    echo "FAIL: $label"
  fi
}

is_real_db=1
if [ -z "$DATABASE_URL_VALUE" ] || [[ "$DATABASE_URL_VALUE" =~ USERNAME|PASSWORD|HOST|YOUR_|example ]]; then
  is_real_db=0
fi

access_ok=0
refresh_ok=0
admin_ok=0
[ "${#ACCESS_SECRET}" -ge 32 ] && access_ok=1
[ "${#REFRESH_SECRET}" -ge 32 ] && refresh_ok=1
[ "${#ADMIN_PASSWORD}" -ge 12 ] && admin_ok=1

status "DATABASE_URL appears configured" "$is_real_db"
status "JWT_ACCESS_SECRET length >= 32" "$access_ok"
status "JWT_REFRESH_SECRET length >= 32" "$refresh_ok"
status "SEED_ADMIN_PASSWORD length >= 12" "$admin_ok"

unset DATABASE_URL_VALUE ACCESS_SECRET REFRESH_SECRET ADMIN_PASSWORD

if [ "$is_real_db" -ne 1 ] || [ "$access_ok" -ne 1 ] || [ "$refresh_ok" -ne 1 ] || [ "$admin_ok" -ne 1 ]; then
  echo "Preflight failed. No secret values were printed."
  exit 1
fi

echo "Preflight passed. Secret values were not printed."
