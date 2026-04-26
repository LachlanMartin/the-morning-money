@AGENTS.md

# Morning Money — project rules

## Legal: AFSL constraint
Claude-generated output must be **general information + sentiment only** — never personalised to a user's portfolio, holdings, or risk profile. Personalising market commentary triggers Australian "personal advice" rules under AFSL.

- Don't feed user-specific portfolio context (holdings size, risk tolerance, financial goals) into prompts.
- In UI/email copy, avoid second-person recommendations like "you should buy/sell". Keep it descriptive: "the announcement suggests…", "sentiment is positive".
- Disclaimers + ToS need a lawyer review before paid launch.

## Architecture: per-announcement analysis
One `Analysis` row per `Announcement`, fanned out to many `DigestRun`s. Never analyse the same announcement once per watching user. This caps LLM cost at O(announcements), independent of user count. Only analyse tickers in ≥1 watchlist — never the whole market.

## Prisma 7 connection layout
Connection URLs are **not** in `schema.prisma` — the `datasource db` block declares `provider` only.
- Migrations: `DIRECT_URL` (port 5432) via `prisma.config.ts` `datasource.url`.
- Runtime: `DATABASE_URL` (port 6543, `pgbouncer=true`) via `PrismaPg` adapter in `src/lib/prisma.ts`.

## Next.js 16 conventions
- Session refresh lives in `src/proxy.ts` (Next 16 renamed `middleware` → `proxy`). Export must be named `proxy`, not `middleware`.
- shadcn/ui Button (Base UI based) does **not** support `asChild`. To render a link styled as a button, use `buttonVariants()` className on a `<Link>`.

## Idempotency
The cron worker may retry. Preserve idempotency hooks:
- `Announcement.sourceHash` is unique — dedupe announcements by hash before insert.
- `DigestRun(userId, date)` is unique — never send a digest twice for the same user/day.
- Use Resend idempotency keys for email sends.
