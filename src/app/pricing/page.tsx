import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { createCheckoutSession, createPortalSession } from "./actions";

export default async function PricingPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="text-center mb-10">
        <h1
          className="font-heading text-[clamp(32px,3.2vw,48px)] font-black tracking-tight leading-tight mb-3"
          style={{ fontFamily: "var(--font-heading-family)" }}
        >
          Simple Pricing
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          The Morning Money is open-source. Run it yourself for free, or let us
          host it for you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-3xl mx-auto">
        {/* SELF-HOST */}
        <div className="border border-border bg-surface p-6 flex flex-col">
          <h2
            className="font-heading text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            Self-Host
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Run on your own infrastructure</p>
          <p className="text-4xl font-heading font-black mb-6" style={{ fontFamily: "var(--font-heading-family)" }}>
            $0
            <span className="text-sm font-body font-normal text-muted-foreground">/month + your API costs</span>
          </p>
          <ul className="space-y-2 text-sm mb-8 flex-1">
            <li className="flex items-baseline gap-2">
              <span className="text-accent-link">{'\u2713'}</span> Unlimited watchlists
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-accent-link">{'\u2713'}</span> Unlimited tickers
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-accent-link">{'\u2713'}</span> AI-powered analysis
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-accent-link">{'\u2713'}</span> Daily email digest
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-accent-link">{'\u2713'}</span> You manage your own
              Anthropic + Resend + Supabase keys
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-accent-link">{'\u2713'}</span> Analysis runs against
              your own database (no cross-user sharing)
            </li>
          </ul>
          <Link
            href="https://github.com/LachlanMartin/morning-money"
            className={buttonVariants({
              variant: "outline",
              className: "w-full text-xs font-mono tracking-wider uppercase",
            })}
          >
            View on GitHub
          </Link>
        </div>

        {/* HOSTED */}
        <div className="border-2 border-foreground bg-surface p-6 flex flex-col relative">
          <span className="absolute -top-2.5 left-4 bg-background px-2 font-mono text-[10px] uppercase tracking-wider text-accent-link">
            Recommended
          </span>
          <h2
            className="font-heading text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            Pro (Hosted)
          </h2>
          <p className="text-sm text-muted-foreground mb-4">We manage everything for you</p>
          <p className="text-4xl font-heading font-black mb-6" style={{ fontFamily: "var(--font-heading-family)" }}>
            $19
            <span className="text-sm font-body font-normal text-muted-foreground">/month</span>
          </p>
          <ul className="space-y-2 text-sm mb-8 flex-1">
            <li className="flex items-baseline gap-2">
              <span className="text-accent-link">{'\u2713'}</span> 20 watchlists
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-accent-link">{'\u2713'}</span> 50 tickers per watchlist
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-accent-link">{'\u2713'}</span> 150 distinct tickers total
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-accent-link">{'\u2713'}</span> AI-powered analysis
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-accent-link">{'\u2713'}</span> Daily email digest
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-accent-link">{'\u2713'}</span> No API keys to manage
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-accent-link">{'\u2713'}</span> Analyses shared across all
              users {'\u2014'} fewer duplicate API calls
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-accent-link">{'\u2713'}</span> Priority support
            </li>
          </ul>
          {user?.plan === "PAID" ? (
            <form action={createPortalSession}>
              <button
                type="submit"
                className={buttonVariants({
                  className:
                    "w-full text-xs font-mono tracking-wider uppercase",
                })}
              >
                Manage Billing
              </button>
            </form>
          ) : (
            <form action={createCheckoutSession}>
              <button
                type="submit"
                className={buttonVariants({
                  className:
                    "w-full text-xs font-mono tracking-wider uppercase",
                })}
              >
                {user ? "Upgrade to Pro" : "Get Started"}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-12 border border-border bg-surface p-6 max-w-3xl mx-auto">
        <h3
          className="font-heading text-lg font-bold mb-2"
          style={{ fontFamily: "var(--font-heading-family)" }}
        >
          How shared analysis works
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ASX announcements are analysed once per ticker, not once per user.
          When BHP releases an announcement, our backend analyses it a single
          time with Claude. Every user watching BHP receives that same analysis
          in their digest. This keeps AI costs predictable and avoids redundant
          API calls. Self-hosted instances do their own analysis independently.
          To prevent abuse, the hosted Pro plan caps total distinct tickers at
          150 across all watchlists.
        </p>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-8">
        Cancel anytime. No questions asked.
      </p>
    </div>
  );
}
