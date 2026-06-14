# The Morning Money — project rules

## Legal: AFSL constraint

Claude-generated output must be **general information + sentiment only** — never personalised to a user's portfolio, holdings, or risk profile. Personalising market commentary triggers Australian "personal advice" rules under AFSL.

- Don't feed user-specific portfolio context into prompts.
- In UI/email copy, avoid second-person recommendations like "you should buy/sell". Keep it descriptive.
- Disclaimers + ToS need a lawyer review before paid launch.

## Architecture: per-announcement analysis

One `Analysis` row per `Announcement`, fanned out to many `DigestRun`s. Never analyse the same announcement once per watching user. This caps LLM cost at O(announcements), independent of user count. Only analyse tickers in ≥1 watchlist — never the whole market.

## Commands

Package manager is **pnpm**. Prisma client path: `src/generated/prisma/`.

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start Next.js dev server (port 3000) |
| `pnpm run build` | `prisma generate && next build` |
| `pnpm run lint` | ESLint |
| `pnpm run test` | Vitest unit tests |
| `pnpm run test:e2e` | Playwright e2e |
| `./scripts/trigger-digest.sh` | Run daily digest pipeline manually |
| `npx prisma migrate dev` | Create migration after schema changes |
| `npx prisma generate` | Regenerate Prisma client |
| `pnpm run test:watch` | Vitest watch mode |
| `npx prisma studio` | Database UI (port 51212) |

Pre-existing type error in `src/__tests__/analysis-ai.test.ts` (pdf-parse type mismatch) — ignore.

## Dev setup

```bash
docker compose up -d db ollama mailpit   # Postgres + Ollama + Mailpit
pnpm run dev                              # Next.js on :3000
```

Auth: single-user, auto-created from `LOCAL_USER_EMAIL` env var. No real auth middleware — proxy.ts is a pass-through.

Docker build uses `output: "standalone"` when `DOCKER_BUILD=1` (next.config.ts).

## Prisma 7 connection layout

Connection URLs are **not** in `schema.prisma` — the `datasource db` block declares `provider` only.

- Migrations: `DIRECT_URL` via `prisma.config.ts` `datasource.url`.
- Runtime: `DATABASE_URL` via `PrismaPg` adapter in `src/lib/prisma.ts`.
- These can differ (e.g. direct vs pooled) — see `.env.example` for defaults.

## Next.js 16 conventions

- Session refresh lives in `src/proxy.ts` (Next 16 renamed `middleware` → `proxy`). Export must be named `proxy`, not `middleware`. Matcher excludes `/api/cron/` from session refresh.
- shadcn/ui Button (Base UI based) does **not** support `asChild`. Use `buttonVariants()` className on a `<Link>`.

## Daily digest pipeline

The cron endpoint `GET /api/cron/daily-digest` (Bearer `CRON_SECRET`) runs 4 steps:

1. **Ingest** — fetch ASX announcements for all watchlisted tickers, download PDFs
2. **Analyse** — send unprocessed PDFs to Ollama for summary + sentiment + direction
3. **Digest** — create `DigestRun` per active user with their tickers' analysis IDs
4. **Email** — send digest email via SMTP

Automated by the `cron` sidecar in docker-compose.yml — runs at 10am weekdays. Depends on `app` container. For local dev, trigger manually with `./scripts/trigger-digest.sh`.

Skips weekends (`dayOfWeek === 0 || 6` in `digest.ts`). No public holiday logic. Only processes tickers belonging to active (paid/trial) users.

## Idempotency

The cron endpoint may retry. Preserve idempotency hooks:

- `Announcement.sourceHash` is unique — dedupe announcements by hash before insert.
- `DigestRun(userId, date)` is unique — email sent at most once per user/day, subsequent runs skip.

## Storage

PDFs are stored locally in `pdfs/` directory, keyed as `local://<filename>.pdf`.

## CI

No CI workflows configured.
