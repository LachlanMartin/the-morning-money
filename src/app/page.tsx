import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { isLocalMode } from "@/lib/app-mode";

export default async function HomePage() {
  if (isLocalMode()) redirect("/dashboard");

  let user = null;
  try {
    const supabase = await createClient();
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    // supabase unreachable or error — show landing page
  }

  if (user) redirect("/dashboard");

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-6">
      {/* Dateline */}
      <div className="flex items-center justify-between text-xs font-mono tracking-wider text-muted-foreground py-3 border-b border-border">
        <span>{dateStr}</span>
        <span>ASX Edition</span>
      </div>

      {/* 4-column newspaper grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-l border-border">
        {/* Lead story — spans 3 cols */}
        <article className="lg:col-span-3 p-6 sm:p-7 lg:p-8 border-r border-border border-b border-border">
          <p className="text-xs font-mono tracking-wider uppercase text-accent-link mb-3">
            Lead Story
          </p>
          <h1
            className="font-heading text-[clamp(32px,3.2vw,52px)] font-black tracking-tight leading-[1.05] mb-4"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            ASX Announcements, Explained.
          </h1>
          <div className="text-[17px] leading-relaxed text-foreground/85 space-y-4 max-w-[65ch]">
            <p>
              Every trading day, hundreds of ASX announcements cross the wire
              — quarterly reports, capital raises, director changes,
              market-sensitive updates. Most are dense, legalistic documents
              that take minutes to parse, and by then the morning bell has
              rung.
            </p>
            <p>
              <span className="font-semibold text-foreground">
                The Morning Money
              </span>{" "}
              reads every announcement so you don&apos;t have to. Each morning
              you get a curated briefing: what changed, who it affects, and
              whether the signal is positive, neutral, or negative. General
              information only — never personal advice. We cut through the
              compliance boilerplate so you can start your day informed.
            </p>
          </div>
        </article>

        {/* Sidebar — 1 col spans full height */}
        <aside className="p-6 sm:p-7 lg:p-8 border-b border-border bg-surface">
          <div className="border-2 border-foreground p-5 mb-6">
            <h3
              className="font-heading text-xl font-extrabold mb-2"
              style={{ fontFamily: "var(--font-heading-family)" }}
            >
              Start Free Trial
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Seven days of daily briefings, watchlists, and AI-powered
              analysis. No credit card required.
            </p>
            <Link
              href="/signup"
              className={buttonVariants({
                className:
                  "w-full text-xs font-mono tracking-wider uppercase transition-all",
              })}
            >
              Get Started
            </Link>
          </div>
          <ul className="space-y-0 text-sm">
            {[
              ["Watchlists", "Track the tickers that matter to you."],
              [
                "Sentiment Signals",
                "Every announcement rated POSITIVE, NEUTRAL, or NEGATIVE.",
              ],
              [
                "AI Analysis",
                "Claude-powered summaries that cut through the boilerplate.",
              ],
              [
                "Daily Digest",
                "Email delivery at 7:00 AM AEST, before the market opens.",
              ],
            ].map(([strong, text]) => (
              <li
                key={strong}
                className="py-2.5 border-b border-border last:border-none"
              >
                <strong className="font-heading font-bold">
                  {strong}
                </strong>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </aside>

        {/* Feature 1 */}
        <article className="p-6 sm:p-7 lg:p-8 border-r border-border border-b border-border">
          <p className="text-xs font-mono tracking-wider uppercase text-accent-link mb-2">
            Feature
          </p>
          <h2
            className="font-heading text-xl font-extrabold leading-tight mb-2"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            Watch What Matters
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Build watchlists for sectors, themes, or individual positions. See
            a single feed of every announcement across your selected tickers,
            sorted by market sensitivity.
          </p>
        </article>

        {/* Feature 2 */}
        <article className="p-6 sm:p-7 lg:p-8 border-r border-border border-b border-border sm:border-r-0 lg:border-r border-border">
          <p className="text-xs font-mono tracking-wider uppercase text-accent-link mb-2">
            Feature
          </p>
          <h2
            className="font-heading text-xl font-extrabold leading-tight mb-2"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            Clear Sentiment Signals
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Each announcement carries a POSITIVE, NEUTRAL, or NEGATIVE rating
            based on language analysis. At a glance you know whether an update
            is worth a deep read or a quick skim.
          </p>
        </article>

        {/* Feature 3 */}
        <article className="p-6 sm:p-7 lg:p-8 border-r border-border border-b border-border">
          <p className="text-xs font-mono tracking-wider uppercase text-accent-link mb-2">
            Feature
          </p>
          <h2
            className="font-heading text-xl font-extrabold leading-tight mb-2"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            AI-Powered Analysis
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Claude processes every ASX filing within minutes of release. Raw
            compliance language becomes plain English: what changed, why it
            matters, and what to watch next.
          </p>
        </article>

        {/* Feature 4 */}
        <article className="p-6 sm:p-7 lg:p-8 border-r border-border border-b border-border sm:border-r-0 lg:border-r border-border">
          <p className="text-xs font-mono tracking-wider uppercase text-accent-link mb-2">
            Feature
          </p>
          <h2
            className="font-heading text-xl font-extrabold leading-tight mb-2"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            Daily Digest
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A curated email lands at 7:00 AM AEST, before the ASX opens. Top
            announcements, your watchlist tickers, and the morning&apos;s most
            important signal changes.
          </p>
        </article>
      </div>
    </div>
  );
}
