import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AddWatchlistForm } from "./AddWatchlistForm";
import { WatchlistCard } from "./WatchlistCard";
import { UpgradeToast } from "@/components/UpgradeToast";

const LIMITS = {
  FREE: { maxDistinctTickers: 20 },
  PAID: { maxDistinctTickers: 150 },
} as const;

export default async function DashboardPage() {
  const user = await requireUser();

  const watchlists = await prisma.watchlist.findMany({
    where: { userId: user.id },
    include: {
      tickers: { orderBy: { asxCode: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  const tickerCount = watchlists.reduce(
    (sum, w) => sum + w.tickers.length,
    0,
  );

  const distinctTickers = new Set(
    watchlists.flatMap((w) => w.tickers.map((t) => t.asxCode)),
  ).size;

  const limit = LIMITS[user.plan];
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const trialDaysLeft = user.plan === "FREE" && user.trialExpiresAt
    ? Math.max(0, Math.ceil((user.trialExpiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const planBadge =
    user.plan === "PAID"
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
      : "bg-surface text-muted-foreground border-border";

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <UpgradeToast />

      {/* Dateline */}
      <div className="flex items-center justify-between text-xs font-mono tracking-wider text-muted-foreground pb-3 border-b border-border">
        <span>{dateStr} &middot; ASX Edition</span>
        <div className="flex items-center gap-3">
          {trialDaysLeft !== null && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {trialDaysLeft === 0
                ? "Trial ended"
                : `${trialDaysLeft} ${trialDaysLeft === 1 ? "day" : "days"} left`}
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${planBadge}`}
          >
            {user.plan === "PAID" ? "Pro" : "Free"} Plan
          </span>
        </div>
      </div>

      {/* Dashboard header */}
      <div className="mt-8 mb-2 flex items-start justify-between">
        <div>
          <h1
            className="font-heading text-[clamp(28px,3vw,36px)] font-extrabold leading-tight"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            Your Watchlists
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track the announcements that move your portfolio.
          </p>
        </div>
        <Link
          href="/dashboard/reports"
          className="text-sm text-muted-foreground hover:text-accent-link transition-colors font-mono text-xs uppercase tracking-wider pt-1"
        >
          Reports &rarr;
        </Link>
      </div>

      {/* Summary stats with usage limits */}
      <div className="flex gap-8 items-baseline py-4 border-b border-border mb-6">
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-heading text-3xl font-extrabold leading-none"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            {distinctTickers}
            <span className="text-base font-normal text-muted-foreground">
              /{limit.maxDistinctTickers}
            </span>
          </span>
          <span className="text-sm text-muted-foreground uppercase font-mono text-xs tracking-wider">
            Unique Tickers
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-heading text-3xl font-extrabold leading-none"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            {watchlists.length}
          </span>
          <span className="text-sm text-muted-foreground uppercase font-mono text-xs tracking-wider">
            Watchlists
          </span>
        </div>
      </div>

      {/* Add watchlist */}
      <div className="mb-6">
        <AddWatchlistForm />
      </div>

      {/* Watchlist grid */}
      {watchlists.length === 0 ? (
        <div className="border border-border p-12 sm:p-16 text-center bg-surface">
          <h3
            className="font-heading text-xl font-bold mb-2"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            No watchlists yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-[36ch] mx-auto leading-relaxed">
            Create your first watchlist above to start tracking ASX
            announcements.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {watchlists.map((watchlist) => (
            <WatchlistCard key={watchlist.id} watchlist={watchlist} />
          ))}
        </div>
      )}
    </div>
  );
}
