# Morning Money

Plain-English summaries of ASX announcements for the tickers you watch. Delivered every morning.

> Portfolio project demonstrating full-stack SaaS architecture — auth, database, AI analysis, scheduled jobs, email delivery, and billing.

---

## Features

- **Supabase Auth** — email/password signup, login, email confirmation, session management
- **Watchlist Manager** — create watchlists, add/remove ASX tickers (e.g. BHP, CBA, TLS)
- **Announcement Ingestion** — scrapes ASX Market Announcements Platform for today's PDFs
- **AI Analysis** (coming next) — per-announcement summaries via Anthropic Claude
- **Daily Digest** (planned) — morning email of analysed announcements via Resend
- **Stripe Billing** (planned) — FREE / PAID plan gating

## Tech Stack

| Layer     | Choice                           |
| --------- | -------------------------------- |
| Framework | Next.js 16 (App Router)          |
| Language  | TypeScript (strict)              |
| Styling   | Tailwind CSS v4, shadcn/ui       |
| Database  | PostgreSQL (Supabase) + Prisma 7 |
| Auth      | Supabase Auth (SSR cookies)      |
| AI        | Anthropic Claude                 |
| Email     | Resend                           |
| Storage   | AWS S3                           |
| Payments  | Stripe                           |

## Architecture

```text
User → Watchlist → WatchlistTicker
                        ↓
               Announcement (from ASX)
                        ↓
                  Analysis (Claude)
                        ↓
                  DigestRun → Email
```

- Announcements are analysed once per ticker, not once per watching user (O(announcements) cost, not O(users))
- AFSL-compliant: analysis is general information + sentiment only, never personalised advice

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project (free tier works)
- (Optional) AWS S3 bucket for PDF storage
- (Optional) Anthropic API key for analysis
- (Optional) Resend API key for emails

### Setup

```bash
git clone <your-repo>
cd morning-money
npm install
```

Copy the environment template and fill in your own values:

```bash
cp .env.example .env
```

At minimum you need a Supabase project URL and anon key. See [.env.example](.env.example) for all options.

```bash
# Run migrations
npx prisma migrate deploy

# Start dev server
npm run dev
```

Open [localhost:3000](http://localhost:3000) → sign up → create watchlists → add tickers.

### Commands

| Command                  | Description                           |
| ------------------------ | ------------------------------------- |
| `npm run dev`            | Start dev server                      |
| `npm run build`          | Production build                      |
| `npm run start`          | Start production server               |
| `npm run lint`           | Run ESLint                            |
| `npx prisma migrate dev` | Create migration after schema changes |
| `npx prisma generate`    | Regenerate Prisma client              |
| `npx prisma studio`      | Open database UI                      |

## Deployment

Deploy to Vercel with zero configuration:

```bash
npm run build    # verify it builds
npx vercel       # deploy
```

Set all env vars from `.env.example` in your Vercel project dashboard.

## Project Status

- [x] Auth + database scaffold
- [x] Watchlist CRUD
- [x] Announcement ingestion
- [ ] AI analysis pipeline
- [ ] Daily digest emails
- [ ] Scheduled cron
- [ ] Stripe billing
- [ ] Production polish

See [PLAN.md](PLAN.md) for the full roadmap.

## License

MIT — see [LICENSE](LICENSE).
