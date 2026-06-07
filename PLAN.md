# Morning Money — Build Plan

Plain-English summaries of ASX announcements for the tickers you watch. Delivered every morning.

---

## Legend

- `[ ]` — Not started
- `[/]` — In progress
- `[x]` — Done

---

## Phase 0: Foundation (Complete)

- [x] Next.js 16 app with TypeScript, Tailwind v4, shadcn/ui
- [x] Supabase Auth — email/password signup, login, logout, email confirmation
- [x] Session management — SSR cookies, proxy.ts middleware, protected routes
- [x] User sync — Supabase `getUser()` → Prisma `User` upsert on every authenticated request
- [x] Prisma 7 schema — `User`, `Watchlist`, `WatchlistTicker`, `Announcement`, `Analysis`, `DigestRun`
- [x] Prisma migrations — init + RLS enablement
- [x] Database connection — PrismaPg adapter (pooled) + prisma.config.ts (direct)

---

## Phase 1: Watchlist Management

Enable users to create watchlists and add ASX tickers.

- [x] **Server actions for watchlist CRUD**
  - [x] `createWatchlist(name)` — creates a new watchlist for the current user
  - [x] `deleteWatchlist(id)` — deletes a watchlist (and its tickers via CASCADE)
  - [x] `addTicker(watchlistId, asxCode)` — adds a ticker (uppercased, validated)
  - [x] `removeTicker(id)` — removes a ticker from a watchlist
  - (done inline — server component fetches via `prisma.watchlist.findMany`)
- [x] **Dashboard UI**
  - [x] Replace placeholder card with real watchlist display
  - [x] "Add watchlist" button → inline form
  - [x] Each watchlist shows its tickers with a remove button
  - [x] "Add ticker" input within each watchlist
  - [x] Empty states ("No watchlists yet", "No tickers in this watchlist")
- [x] **Validation & edge cases**
  - [x] ASX code format: 1–3 uppercase letters (e.g. BHP, CBA, TLS)
  - [x] Duplicate ticker within a watchlist prevented (unique constraint + DB check)
  - [x] Max tickers per watchlist (20 on FREE plan)
  - [x] Max watchlists per user (3 on FREE plan)

---

## Phase 2: Announcement Ingestion

Fetch ASX announcements for watched tickers and store PDFs in S3.

- [x] **ASX data source integration**
  - [x] Research ASX announcement feed/API — uses ASX Market Announcements Platform (`announcements.do` endpoint, HTML scraping)
  - [x] Build `src/lib/asx.ts` — fetches recent announcements for a given ASX code, parses HTML table
  - [x] Parse announcement metadata (headline, published date, PDF URL via T&Cs page)
  - [x] PDF download via hidden `pdfURL` → direct download from `announcements.asx.com.au`
- [x] **PDF storage (S3)**
  - [x] Implement `src/lib/s3.ts` — S3 upload with graceful fallback when not configured
  - [x] If S3 configured: download PDF → upload to S3 → store S3 key
  - [x] If S3 not configured: store `asx://` URL reference as key (ready for backfill)
- [x] **Deduplication**
  - [x] Hash `idsId` (ASX announcement ID) via SHA-256 → `sourceHash` unique constraint
  - [x] Idempotent: checks `sourceHash` before insert, skips duplicates (also catches Prisma P2002)
- [x] **Scoping**
  - [x] `ingestAllWatchlistedTickers()` — fetches distinct `asxCode`s from all watchlists
  - [x] `ingestAnnouncements(code)` — per-ticker ingestion with per-announcement error handling
  - (lookback: `period=T` = today only, suitable for daily cron)

---

## Phase 3: AI Analysis

Run each new announcement through Claude to produce a plain-English summary.

- [x] **Anthropic client setup**
  - [x] `src/lib/anthropic.ts` — configured client
  - [x] Define system prompt (general info + sentiment only, per AFSL constraint)
  - [x] Define output schema (summary, sentiment, predicted direction, confidence)
- [x] **Analysis pipeline**
  - [x] `analyzeAnnouncement(announcementId)` — fetches PDF text → sends to Claude → stores `Analysis` row
  - [x] Track `model` and `promptVersion` in each analysis (for reproducibility)
  - [x] Handle errors gracefully (rate limits, API failures) — mark for retry
- [x] **Prompt design**
  - [x] System prompt references AFSL constraint: no personal advice, no buy/sell recommendations
  - [x] Output structured as: sentiment (POSITIVE/NEUTRAL/NEGATIVE), direction (UP/FLAT/DOWN), confidence (0–1), summary (markdown)
  - [x] Prompt versioning — iterate without breaking existing analysis

---

## Phase 4: Daily Digest Email

Compile the day's analyses per user and send via Resend.

- [x] **Resend client setup**
  - [x] `src/lib/resend.ts` — configured client
  - [x] Email template (HTML with newspaper styling)
  - [x] Unsubscribe link in email footer
- [x] **Digest generation**
  - [x] `generateDigestRun(userId)` — creates/upserts a `DigestRun` row with today's analyses for the user's watchlist tickers
  - [x] Compile analysis summaries into email body
  - [x] AFSL disclaimer in every email
- [x] **Email sending**
  - [x] `sendDigest(digestRunId)` — sends via Resend with idempotency key
  - [x] Update `DigestRun.sentAt` on success
  - [x] Retry-safe (idempotency key prevents duplicates)
- [x] **Idempotency**
  - [x] `DigestRun(userId, date)` unique constraint prevents duplicate digests
  - [x] Resend idempotency keys prevent duplicate email sends

---

## Phase 5: Scheduled Jobs

Wire up a daily cron to orchestrate the pipeline.

- [x] **Cron endpoint**
  - [x] `GET /api/cron/daily-digest` — protected by `CRON_SECRET` authorization header
  - [x] Steps: fetch tickers from all watchlists → fetch announcements → analyze → generate digests → send emails
  - [x] Idempotent: safe to retry (source hash dedup, digest date unique, Resend idempotency keys)
- [x] **Scheduling**
  - [x] Cron endpoint ready — configure external trigger (cron-job.org, Vercel Cron, GitHub Actions)
  - [x] Run after ASX market close / before morning delivery (e.g. 6am AEST)
- [x] **Monitoring & logging**
  - [x] Log each step count (announcements fetched, analyzed, digests generated, emails sent)
  - [x] Errors collected and returned in response

---

## Phase 6: Billing (Stripe)

Monetize with a FREE / PAID plan.

- [x] **Stripe integration**
  - [x] `src/lib/stripe.ts` — configured client
  - [x] Webhook handler at `/api/webhooks/stripe` (checkout.session.completed, customer.subscription.updated, customer.subscription.deleted)
  - [x] Sync Stripe subscription status → `User.plan` and `User.stripeCustomerId`
- [x] **Pricing page**
  - [x] `/pricing` — FREE vs PAID feature comparison with newspaper styling
  - [x] "Get Started" / "Upgrade" button → Stripe Checkout session
  - [x] "Manage billing" → Stripe Customer Portal for existing PAID users
- [x] **Plan gating**
  - [x] FREE: 3 watchlists, 20 tickers per watchlist (enforced in server actions)
  - [x] PAID: unlimited (no limit checks for PAID users)
  - [x] "Upgrade" link in header for FREE users
- [x] **Edge cases**
  - [x] Handle subscription cancellation/downgrade — enforce limits on next write, not retroactively
  - [ ] Trial period (deferred decision — signup creates FREE account, not trial)

---

## Phase 7: Pre-Launch Polish

- [x] **Legal & compliance**
  - [x] Terms of Service page at `/terms`
  - [x] Privacy Policy page at `/privacy`
  - [x] AFSL disclaimer in footer, dashboard, and email templates
  - [ ] Lawyer review (required before paid launch)
- [x] **Branding**
  - [x] Title in layout metadata
  - [x] `package.json` name
  - [x] Favicon (SVG)
  - [x] Proper README (existing)
- [x] **Production readiness**
  - [x] Error boundary at `/error`
  - [ ] Rate limiting on auth endpoints (deferred — Supabase handles abuse)
  - [ ] CSRF protection (Next.js server actions are CSRF-protected by default)
  - [ ] Check Supabase project — enable email confirmation, configure redirect URLs
  - [ ] Domain + email DNS config (deferred to deployment)

---

## Phase 8: Testing

- [x] **Test setup**
  - [x] Vitest installed and configured
  - [x] Test scripts in `package.json` (`npm run test`, `npm run test:watch`)
- [x] **Unit tests**
  - [x] Analysis validation logic (5 passing tests)
  - [ ] Auth server actions (needs test database)
  - [ ] Watchlist server actions (needs test database)
  - [ ] Digest generation (needs test database)
- [ ] **Integration tests** (deferred — needs separate test database)
- [ ] **E2E tests** (deferred — optional)

---

## Milestones

| Milestone                | Target | Description                                                 |
| ------------------------ | ------ | ----------------------------------------------------------- |
| **M1: Watchlists Live**  | —      | Users can manage ASX tickers on the dashboard               |
| **M2: Pipeline Working** | —      | Cron fetches → analyzes → emails end-to-end                 |
| **M3: Paid Launch**      | —      | Public launch with Stripe billing, legal, production polish |

---

## Future Ideas (Backlog)

- [ ] Mobile push notifications (important announcements)
- [ ] Weekly digest option
- [ ] Portfolio tracking (ticker + quantity) — _blocked by AFSL unless purely for UI convenience_
- [ ] Custom digest time preference per user
- [ ] Historical announcement search
- [ ] Browser extension ("add to Morning Money")
- [ ] Multi-language summaries
