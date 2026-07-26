#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${SMOKE_BASE_URL:-http://127.0.0.1:3000}"
COMPOSE_FILE="docker-compose.local.yml"
FAILURES=0

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; FAILURES=$((FAILURES + 1)); }

echo "Memoria smoke test"
echo "=================="
echo "Base URL: $BASE_URL"
echo ""

echo "Environment"
if [[ -f .env ]]; then
  pass ".env exists"
else
  fail ".env missing — run: cp .env.example .env"
fi

if [[ -f .env ]] && grep -q '^AUTH_SECRET=' .env; then
  secret_len=$(grep '^AUTH_SECRET=' .env | cut -d= -f2- | tr -d '"' | wc -c | tr -d ' ')
  if [[ "$secret_len" -ge 32 ]]; then
    pass "AUTH_SECRET length ok"
  else
    fail "AUTH_SECRET must be at least 32 characters"
  fi
else
  fail "AUTH_SECRET not set in .env"
fi

echo ""
echo "Docker"
if command -v docker >/dev/null 2>&1; then
  if docker compose -f "$COMPOSE_FILE" ps --status running 2>/dev/null | grep -q postgres; then
    pass "PostgreSQL container running"
  else
    fail "PostgreSQL not running — run: task db:up"
  fi
else
  fail "Docker not found"
fi

echo ""
echo "HTTP (server must already be running — use  task dev:only  in another terminal)"
if ! curl -sf --max-time 5 "$BASE_URL/api/ping" >/tmp/smoke-ping.json 2>/dev/null; then
  fail "Cannot reach $BASE_URL — start dev server: task dev:only"
  echo ""
  echo "Result: $FAILURES check(s) failed"
  exit 1
fi

if grep -q '"db":true' /tmp/smoke-ping.json || grep -q '"db": true' /tmp/smoke-ping.json; then
  pass "/api/ping (database reachable)"
else
  fail "/api/ping returned but database is down"
fi

if curl -sf --max-time 30 -o /dev/null -w "%{http_code}" "$BASE_URL/login" | grep -q 200; then
  pass "GET /login"
else
  fail "GET /login"
fi

if curl -sf --max-time 30 -o /dev/null -w "%{http_code}" "$BASE_URL/" | grep -q 200; then
  pass "GET /"
else
  fail "GET /"
fi

providers=$(curl -sf --max-time 30 "$BASE_URL/api/auth/providers" || true)
if echo "$providers" | grep -q credentials; then
  pass "GET /api/auth/providers"
else
  fail "GET /api/auth/providers"
fi

reset_location=$(curl -sI --max-time 30 "$BASE_URL/api/auth/reset-session" | tr -d '\r' | grep -i '^location:' | awk '{print $2}' || true)
if echo "$reset_location" | grep -q '/login?session=reset'; then
  pass "GET /api/auth/reset-session redirects to login"
else
  fail "GET /api/auth/reset-session (expected redirect to /login?session=reset)"
fi

echo ""
if [[ "$FAILURES" -eq 0 ]]; then
  echo "All smoke checks passed."
  echo ""
  echo "Next: open $BASE_URL/register to create an account (no demo users are seeded)."
  echo "If you see JWT errors in the terminal, visit $BASE_URL/api/auth/reset-session"
  exit 0
fi

echo "$FAILURES check(s) failed."
exit 1
