#!/usr/bin/env bash
set -e

echo ""
echo "🏦  The Morning Money — starting local dev environment..."
echo ""

STATUS=$(supabase status 2>&1 || true)

if echo "$STATUS" | grep -qi "is running"; then
  echo "→ Supabase is already running"
else
  echo "→ Starting Supabase local stack..."
  supabase start
fi

supabase status

echo ""
echo "→ Opening Supabase Studio..."
open http://127.0.0.1:54323

echo "→ Opening Mailpit (auth emails)..."
open http://127.0.0.1:54324

echo "→ Opening Resend (digest emails)..."
open https://resend.com

echo "→ Starting Next.js dev server..."
echo "   http://localhost:3000"
echo ""

sleep 2
open http://localhost:3000

exec npx next dev
