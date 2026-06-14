#!/usr/bin/env bash
set -e

OPEN="open"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  OPEN="xdg-open"
fi

echo "==> Starting all services (Postgres + Ollama + Mailpit)..."
docker compose up -d db ollama mailpit

echo ""
echo "==> Starting Prisma Studio — http://localhost:5555"
npx prisma studio &
STUDIO_PID=$!

echo "==> Opening browsers..."
echo "    http://localhost:3000   — The Morning Money"
echo "    http://localhost:8025   — Mailpit (emails)"
echo "    http://localhost:5555   — Prisma Studio (database)"
sleep 2
$OPEN "http://localhost:3000" 2>/dev/null || true
$OPEN "http://localhost:8025" 2>/dev/null || true
$OPEN "http://localhost:5555" 2>/dev/null || true

echo ""
echo "==> Starting Next.js..."
trap "kill $STUDIO_PID 2>/dev/null" EXIT
npm run dev
