#!/usr/bin/env bash

# SK Kabunga-an Backend API Testing Script
# Usage: ./scripts/test-api.sh
# Optional environment variables:
#   BASE_URL (default: http://localhost:3000)
#   TEST_ADMIN_USERNAME (default: $SEED_ADMIN_USERNAME or admin)
#   TEST_ADMIN_PASSWORD (default: $SEED_ADMIN_PASSWORD)

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
USERNAME="${TEST_ADMIN_USERNAME:-${SEED_ADMIN_USERNAME:-admin}}"
PASSWORD="${TEST_ADMIN_PASSWORD:-${SEED_ADMIN_PASSWORD}}"

echo "=========================================="
echo "  SK Kabunga-an API Automated Test Runner "
echo "=========================================="
echo "Target Base URL: ${BASE_URL}"
echo "Target User:     ${USERNAME}"
echo "------------------------------------------"

# 1. Health Endpoint Test
echo -n "[1/4] Testing GET /api/health ... "
HEALTH_RESP=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/health")
HEALTH_CODE=$(echo "$HEALTH_RESP" | tail -n 1)
HEALTH_BODY=$(echo "$HEALTH_RESP" | head -n -1)

if [ "$HEALTH_CODE" -eq 200 ]; then
  echo "SUCCESS (HTTP 200)"
  echo "      Response: ${HEALTH_BODY}"
elif [ "$HEALTH_CODE" -eq 503 ]; then
  echo "DEGRADED (HTTP 503 - Database Disconnected)"
  echo "      Response: ${HEALTH_BODY}"
else
  echo "FAILED (HTTP ${HEALTH_CODE})"
  echo "      Response: ${HEALTH_BODY}"
fi

if [ -z "$PASSWORD" ]; then
  echo ""
  echo "⚠️ TEST_ADMIN_PASSWORD / SEED_ADMIN_PASSWORD not set. Skipping Auth and Youth API tests."
  echo "To test authenticated endpoints, run:"
  echo "  TEST_ADMIN_PASSWORD=\"YourPassword\" ./scripts/test-api.sh"
  exit 0
fi

# 2. Login Endpoint Test
echo -n "[2/4] Testing POST /api/auth/login ... "
LOGIN_RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}")

LOGIN_CODE=$(echo "$LOGIN_RESP" | tail -n 1)
LOGIN_BODY=$(echo "$LOGIN_RESP" | head -n -1)

if [ "$LOGIN_CODE" -ne 200 ]; then
  echo "FAILED (HTTP ${LOGIN_CODE})"
  echo "      Response: ${LOGIN_BODY}"
  exit 1
fi

echo "SUCCESS (HTTP 200)"

# Extract Access Token using node JS (avoiding jq dependency issues)
ACCESS_TOKEN=$(node -e "try { const data = JSON.parse(process.argv[1]); console.log(data.data?.accessToken || data.accessToken || ''); } catch { process.exit(1); }" "$LOGIN_BODY")

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Could not extract access token from login response."
  exit 1
fi

# 3. Current User Endpoint Test (/api/auth/me)
echo -n "[3/4] Testing GET /api/auth/me ... "
ME_RESP=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/auth/me" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

ME_CODE=$(echo "$ME_RESP" | tail -n 1)
ME_BODY=$(echo "$ME_RESP" | head -n -1)

if [ "$ME_CODE" -eq 200 ]; then
  echo "SUCCESS (HTTP 200)"
else
  echo "FAILED (HTTP ${ME_CODE})"
  echo "      Response: ${ME_BODY}"
fi

# 4. Youth Records API Test (/api/youth)
echo -n "[4/4] Testing GET /api/youth ... "
YOUTH_RESP=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/youth" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

YOUTH_CODE=$(echo "$YOUTH_RESP" | tail -n 1)
YOUTH_BODY=$(echo "$YOUTH_RESP" | head -n -1)

if [ "$YOUTH_CODE" -eq 200 ]; then
  echo "SUCCESS (HTTP 200)"
else
  echo "FAILED (HTTP ${YOUTH_CODE})"
  echo "      Response: ${YOUTH_BODY}"
fi

echo "=========================================="
echo "  API Test Run Finished"
echo "=========================================="
