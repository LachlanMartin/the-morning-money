# The Morning Money

Plain-English summaries of ASX announcements for the tickers you watch. Delivered every morning.

**Zero external accounts required.** `git clone && docker compose up` gives you a fully working app — local LLM, local email, local storage.

---

## Quick Start

```bash
git clone https://github.com/LachlanMartin/the-morning-money
cd the-morning-money
cp .env.example .env
docker compose up -d

# One-time setup:
docker compose exec app npx prisma migrate deploy
docker compose exec ollama ollama pull gemma3:12b
```

Open [localhost:3000](http://localhost:3000).

### Services

| Service       | URL                     | Purpose                        |
| ------------- | ----------------------- | ------------------------------ |
| App           | http://localhost:3000   | Next.js UI                     |
| Prisma Studio | http://localhost:51212  | Database UI (`npx prisma studio`) |
| Mailpit       | http://localhost:8025   | Captures all outbound email    |
| Ollama        | http://localhost:11434  | Local LLM API                  |

## Local dev (without Docker)

**Prerequisites:** Node 20+, PostgreSQL 17 with pgvector, Ollama.

```bash
pnpm install
cp .env.example .env
ollama pull gemma3:12b
npx prisma migrate deploy
pnpm run dev
```

---

## Daily Digest Pipeline

The app fetches ASX announcements, analyses them via Ollama, and emails a summary. Runs weekdays at 10am AEST via a cron sidecar in docker-compose. Trigger manually:

```bash
./scripts/trigger-digest.sh
```

### Steps

1. **Ingest** — fetch ASX announcements for all watchlisted tickers, download PDFs to `pdfs/`
2. **Analyse** — send unprocessed PDFs to Ollama for summary + sentiment + direction
3. **Digest** — create `DigestRun` per active user with their tickers' analysis IDs
4. **Email** — send digest via SMTP (Mailpit by default)

Idempotency: announcements deduplicated by `sourceHash`, and at most one email per user/day via `DigestRun(userId, date)` unique constraint.

---

## Architecture notes

| Topic | Detail |
|-------|--------|
| **Auth** | Single-user, auto-created from `LOCAL_USER_EMAIL`. `proxy.ts` (Next.js 16 renamed `middleware`) is a pass-through — no login screen. |
| **Prisma 7** | Dual connection layout: `DIRECT_URL` for migrations (port 5432, defined in `prisma.config.ts`), `DATABASE_URL` for runtime queries via `PrismaPg` adapter. |
| **Storage** | PDFs stored locally in `pdfs/`, keyed as `local://<filename>.pdf`. |
| **Cost** | LLM cost capped at O(announcements) — one analysis per announcement, not per user. |

---

## Commands

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Next.js dev server (port 3000) |
| `pnpm run build` | `prisma generate && next build` |
| `pnpm run start` | Production server |
| `pnpm run lint` | ESLint |
| `pnpm run test` | Vitest unit tests |
| `pnpm run test:e2e` | Playwright e2e tests |
| `./scripts/trigger-digest.sh` | Run digest pipeline manually |
| `./scripts/seed-watchlists.ts` | Seed sample watchlists |
| `./scripts/fetch-asx-tickers.ts` | Fetch ASX ticker list |
| `npx prisma migrate dev` | Create migration after schema change |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma studio` | Database UI |

## Configuration

See `.env.example` for all variables. Key ones:

| Variable | Default | Notes |
|----------|---------|-------|
| `LOCAL_USER_EMAIL` | `you@email.com` | Single user auto-created from this |
| `CRON_SECRET` | — | Shared secret for `/api/cron/daily-digest` |
| `OLLAMA_MODEL` | `gemma3:12b` | Swap for `mistral:7b`, `llama3.2:3b`, etc. |

---

## License

MIT — see [LICENSE](LICENSE).
