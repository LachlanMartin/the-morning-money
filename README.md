<p align="center">
  <img src="public/favicon.svg" alt="The Morning Money" width="128">
</p>

<h1 align="center">The Morning Money</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js">
  <img src="https://img.shields.io/badge/license-MIT-blue">
</p>

Plain-English summaries of ASX announcements for the tickers you watch. Delivered every morning.

**Self-contained stack.** `git clone && docker compose up` gives you a working app — local Postgres, local email capture, local LLM fallback. Add an Anthropic API key for sharper analysis.

---

## Quick Start

```bash
git clone https://github.com/LachlanMartin/the-morning-money
cd the-morning-money
cp .env.example .env
# Optional: add ANTHROPIC_API_KEY=sk-ant-... to .env for sharper analysis
docker compose up -d

# One-time setup:
docker compose exec app npx prisma migrate deploy
docker compose exec ollama ollama pull gemma3:12b
```

Open [localhost:3000](http://localhost:3000).

| Service | URL | Purpose |
|---------|-----|---------|
| App | http://localhost:3000 | Next.js UI |
| Prisma Studio | http://localhost:51212 | Database UI |
| Mailpit | http://localhost:8025 | Captures outbound email |
| Ollama | http://localhost:11434 | Local LLM API |

## Local Dev

**Prerequisites:** Node 20+, PostgreSQL 17 with pgvector, Ollama.

```bash
pnpm install
cp .env.example .env
ollama pull gemma3:12b
npx prisma migrate deploy
pnpm run dev
```

## Digest Pipeline

Fetches ASX announcements, analyses via Anthropic API (or Ollama as fallback), emails a summary. Runs weekdays at 10am AEST via cron sidecar.

Sent via local SMTP in Docker, or via Resend with `SMTP_*` env vars.

```bash
./scripts/trigger-digest.sh
```

1. **Ingest** — fetch ASX announcements for watchlisted tickers, download PDFs
2. **Analyse** — send unprocessed PDFs to Anthropic (or Ollama) for markdown summary + sentiment + direction + confidence
3. **Digest** — create `DigestRun` per active user with their tickers' analysis IDs
4. **Email** — send digest via SMTP (Mailpit by default), rendered as markdown→HTML

Idempotent: announcements deduped by `sourceHash`, at most one email per user/day.

## Architecture

| Topic | Detail |
|-------|--------|
| **Auth** | Single-user, auto-created from `LOCAL_USER_EMAIL`. `proxy.ts` is a pass-through. |
| **Prisma 7** | `DIRECT_URL` for migrations, `DATABASE_URL` for runtime via `PrismaPg` adapter. |
| **Storage** | PDFs stored locally in `pdfs/`, keyed as `local://<filename>.pdf`. |
| **Cost** | LLM cost at O(announcements) — one analysis per announcement, not per user. |

## Commands

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Next.js dev server (port 3000) |
| `pnpm run build` | `prisma generate && next build` |
| `pnpm run start` | Production server |
| `pnpm run lint` | ESLint |
| `pnpm run test` | Vitest unit tests |
| `pnpm run test:e2e` | Playwright e2e |
| `./scripts/trigger-digest.sh` | Run digest pipeline manually |
| `npx prisma migrate dev` | Create migration after schema change |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma studio` | Database UI |

## Configuration

See `.env.example` for all variables.

| Variable | Default | Notes |
|----------|---------|-------|
| `LOCAL_USER_EMAIL` | `you@email.com` | Single user auto-created |
| `CRON_SECRET` | — | Shared secret for `/api/cron/daily-digest` |
| `ANTHROPIC_API_KEY` | — | Optional: use Claude for analysis instead of Ollama |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-20250514` | Anthropic model to use |
| `OLLAMA_MODEL` | `gemma3:12b` | Fallback when `ANTHROPIC_API_KEY` not set |

## License

MIT — see [LICENSE](LICENSE).
