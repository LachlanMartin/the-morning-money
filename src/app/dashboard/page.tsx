import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddWatchlistForm } from "./AddWatchlistForm";
import { WatchlistCard } from "./WatchlistCard";

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

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      {/* Dateline */}
      <div className="flex items-center justify-between text-xs font-mono tracking-wider text-muted-foreground pb-3 border-b border-border">
        <span>{dateStr} &middot; ASX Edition</span>
      </div>

      {/* Dashboard header */}
      <div className="mt-8 mb-2">
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

      {/* Summary stats */}
      <div className="flex gap-8 items-baseline py-4 border-b border-border mb-6">
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
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-heading text-3xl font-extrabold leading-none"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            {tickerCount}
          </span>
          <span className="text-sm text-muted-foreground uppercase font-mono text-xs tracking-wider">
            Tickers Tracked
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
          <div
            className="font-heading text-5xl text-muted-foreground/40 mb-3"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            &Square;
          </div>
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
