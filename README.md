# The Morning Money

Plain-English summaries of ASX announcements for the tickers you watch. Delivered every morning.

> Portfolio project demonstrating full-stack SaaS architecture — auth, database, AI analysis, scheduled jobs, email delivery, and billing.

---

## Features

- **Supabase Auth** — email/password signup, login, email confirmation, session management
- **Watchlist Manager** — create watchlists, add/remove ASX tickers (e.g. BHP, CBA, TLS)
- **Announcement Ingestion** — scrapes ASX Market Announcements Platform for today's PDFs
- **AI Analysis** — per-announcement summaries via Anthropic Claude
- **Daily Digest** — morning email of analysed announcements via Resend
- **Stripe Billing** — FREE / PAID plan gating

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

### Data Flow

```mermaid
flowchart TB
    subgraph Client["Browser"]
        UI["Next.js App Router\nPages + Server Components"]
    end

    subgraph Auth["Authentication"]
        SB["Supabase Auth\nSSR Cookie Sessions"]
        Proxy["proxy.ts\nSession Refresh"]
    end

    subgraph Core["Core Application"]
        direction TB
        WL["Watchlist Manager\nCRUD + Ticker Tracking"]
        ASX["ASX Scraper\nMarket Announcements Platform"]
        Analysis["AI Analysis Pipeline\nAnthropic Claude"]
        Digest["Digest Generator\nPer-User, Per-Day"]
    end

    subgraph Infra["Infrastructure"]
        DB[("PostgreSQL\nSupabase / Docker")]
        S3["AWS S3\nPDF Storage"]
        Resend["Resend\nEmail Delivery"]
        Cron["Cron Worker\nDaily Trigger"]
        Stripe["Stripe\nBilling (Public Mode)"]
    end

    UI --> Proxy
    Proxy --> SB
    SB --> DB
    UI --> WL
    WL --> DB
    Cron --> ASX
    ASX --> S3
    ASX --> DB
    ASX --> Analysis
    Analysis --> DB
    Cron --> Digest
    Digest --> DB
    Digest --> Resend
    Digest --> Analysis
    WL --> Digest
    Stripe --> DB
```

### Key Design Decisions

- **Per-announcement analysis, not per-user**: announcements are analysed once per ticker (O(announcements) cost, not O(users)). All watchers of a ticker share the same analysis.
- **AFSL-compliant**: analysis is general information + sentiment only, never personalised advice. No user portfolio context is fed to the model.
- **Two modes**: `NEXT_PUBLIC_APP_MODE=public` runs the full SaaS (Supabase Auth, Stripe). `NEXT_PUBLIC_APP_MODE=local` drops auth/payments for self-hosted Docker setups — zero external dependencies beyond Anthropic + Resend.

## Getting Started

### Quick Start (Docker)

```bash
git clone https://github.com/LachlanMartin/the-morning-money
cd the-morning-money
cp .env.example .env   # fill in your API keys

docker compose up -d   # starts Postgres + the app
```

The app will be available at [localhost:3000](http://localhost:3000).

Run database migrations the first time:

```bash
docker compose exec app npx prisma migrate deploy
```

> **Tip:** Set `NEXT_PUBLIC_APP_MODE=local` in `.env` for zero-auth self-hosted mode — no Supabase, Stripe, or AWS required. Only Anthropic + Resend keys are mandatory.

### Local Development (without Docker)

#### Prerequisites

- Node.js 20+
- Docker (for local Supabase) **or** a remote Supabase project (free tier works)
- (Optional) AWS S3 bucket for PDF storage
- (Optional) Anthropic API key for analysis
- (Optional) Resend API key for emails

#### Setup

```bash
git clone https://github.com/LachlanMartin/the-morning-money
cd the-morning-money
npm install
```

Copy the environment template and fill in your own values:

```bash
cp .env.example .env
```

`.env.example` has two blocks — remote Supabase (default) and local Supabase (via CLI). Uncomment the one you need. See [.env.example](.env.example) for all options.

```bash
# Run migrations
npx prisma migrate deploy

# Start dev server
npm run dev
```

Open [localhost:3000](http://localhost:3000) → sign up → create watchlists → add tickers.

### Local Supabase

The project can run entirely offline using the Supabase CLI, which spins up
Postgres + Auth + Storage in Docker on your machine.

```bash
brew install supabase/tap/supabase    # if not already installed
supabase start                         # starts all local services
npx prisma generate                    # (re)generate Prisma client
npx prisma migrate deploy              # apply migrations to local DB
npm run dev
```

| Service         | URL                                           |
| --------------- | --------------------------------------------- |
| Supabase API    | `http://127.0.0.1:54321`                      |
| Studio (UI)     | `http://127.0.0.1:54323`                      |
| Mailpit (email) | `http://127.0.0.1:54324`                      |
| Postgres        | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

Email confirmations are disabled locally so sign-ups work without an SMTP
provider. Emails the app would send (password resets, etc.) are captured in
[Mailpit](http://127.0.0.1:54324).

To switch back to your remote Supabase project, swap the commented blocks in
`.env`.

### Commands

| Command                  | Description                              |
| ------------------------ | ---------------------------------------- |
| `npm run dev`            | Start Next.js dev server                 |
| `npm run dev:full`       | Full local env — Supabase + Next.js      |
| `npm run build`          | Production build                         |
| `npm run start`          | Start production server                  |
| `npm run lint`           | Run ESLint                               |
| `npm run test`           | Run unit tests                           |
| `npx prisma migrate dev` | Create migration after schema changes    |
| `npx prisma generate`    | Regenerate Prisma client                 |
| `npx prisma studio`      | Open database UI                         |

## Self-Hosting

The app can be self-hosted via Docker or on any Node.js platform.

### Required Services

| Service           | Purpose                   | Free Tier Available |
| ----------------- | ------------------------- | ------------------- |
| Supabase          | Auth + database           | Yes (cloud)         |
| Anthropic Claude  | AI analysis               | No (paid API)       |
| Resend            | Email delivery            | Yes (100 emails/day)|
| AWS S3            | PDF storage               | Yes (free tier)     |
| Stripe            | Payment processing        | Yes (test mode)     |

### Local Mode (`NEXT_PUBLIC_APP_MODE=local`)

Runs the entire app with zero auth and no payments. A single local user is auto-created from `LOCAL_USER_EMAIL`.

```bash
cp .env.example .env
# Set NEXT_PUBLIC_APP_MODE=local
# Set LOCAL_USER_EMAIL=you@email.com
# Add your ANTHROPIC_API_KEY and RESEND_API_KEY

docker compose up -d
docker compose exec app npx prisma migrate deploy
# → open http://localhost:3000
```

Only Anthropic + Resend API keys are required. Supabase, Stripe, and AWS S3 are optional in local mode.

## Project Status

- [x] Auth + database scaffold
- [x] Watchlist CRUD
- [x] Announcement ingestion
- [x] AI analysis pipeline
- [x] Daily digest emails
- [x] Scheduled cron
- [x] Stripe billing
- [x] Production polish
- [x] Local mode (`NEXT_PUBLIC_APP_MODE=local`) — [#10](https://github.com/LachlanMartin/the-morning-money/issues/10)

See [GitHub Issues](https://github.com/LachlanMartin/the-morning-money/issues) for remaining tasks and future ideas.

## License

MIT — see [LICENSE](LICENSE).
