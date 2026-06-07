import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <header className="text-center">
        <hr className="newspaper-rule-thick" />
        <h1
          className="font-heading text-6xl font-black tracking-tight leading-none pt-4 pb-1"
          style={{ fontFamily: "var(--font-heading-family)" }}
        >
          The Morning Money
        </h1>
        <hr className="newspaper-rule mt-1" />
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground py-1.5">
          {dateStr} &middot; ASX Edition
        </p>
        <hr className="newspaper-rule-thick" />
      </header>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        <article className="md:col-span-2">
          <h2
            className="font-heading text-3xl font-bold leading-tight"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            ASX Announcements, Explained
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Every day, ASX-listed companies publish hundreds of announcements.
            Buried in the jargon are signals that matter — contract wins,
            earnings updates, capital raises, and regulatory changes.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">The Morning Money</span>{" "}
            reads every announcement for the tickers you watch and distills them
            into plain-English summaries. No fluff. No hype. Just the facts, with
            clear sentiment analysis so you know what matters.
          </p>
        </article>

        <aside className="border-l border-border md:pl-6">
          <h3
            className="font-heading text-lg font-bold uppercase tracking-wide"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            At a Glance
          </h3>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="border-b border-border pb-3">
              <span className="font-semibold">AI-Powered</span>
              <p className="text-muted-foreground mt-0.5">
                Each announcement analysed by Claude, Anthropic&apos;s most
                capable AI.
              </p>
            </li>
            <li className="border-b border-border pb-3">
              <span className="font-semibold">Daily Digest</span>
              <p className="text-muted-foreground mt-0.5">
                One email each morning with everything you need to know.
              </p>
            </li>
            <li>
              <span className="font-semibold">Zero Noise</span>
              <p className="text-muted-foreground mt-0.5">
                Only the tickers you care about. No spam. No ads.
              </p>
            </li>
          </ul>
        </aside>
      </div>

      <hr className="newspaper-rule my-8" />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <article>
          <h3
            className="font-heading text-xl font-bold leading-tight"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            Watch What Matters
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Create watchlists for the ASX tickers you follow. Add BHP, CBA,
            TLS, or any ASX-listed company. Change them anytime.
          </p>
        </article>
        <article>
          <h3
            className="font-heading text-xl font-bold leading-tight"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            Clear Sentiment Signals
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Every announcement comes with a sentiment score — positive, neutral,
            or negative — so you can scan what needs your attention first.
          </p>
        </article>
        <article>
          <h3
            className="font-heading text-xl font-bold leading-tight"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            Delivered to Your Inbox
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A crisp morning briefing lands in your inbox before the market
            opens. Read it with your coffee and start the day informed.
          </p>
        </article>
      </div>

      <hr className="newspaper-rule-thick mt-10" />

      <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/signup"
          className={buttonVariants({
            className: "text-sm tracking-wider uppercase px-8",
          })}
        >
          Get Started Free
        </Link>
        <Link
          href="/login"
          className={buttonVariants({
            variant: "outline",
            className: "text-sm tracking-wider uppercase px-8",
          })}
        >
          Sign In
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        General information only. Not financial advice. &copy; 2026 Morning
        Money.
      </p>
    </div>
  );
}
