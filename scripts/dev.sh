#!/usr/bin/env bash
set -e

echo ""
echo "🏦  Morning Money — starting local dev environment..."
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
echo "→ Starting Next.js dev server..."
echo "   http://localhost:3000"
echo ""

exec npx next dev
