import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
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
          className="font-heading text-5xl font-black tracking-tight leading-none pt-4 pb-1"
          style={{ fontFamily: "var(--font-heading-family)" }}
        >
          The Morning Money
        </h1>
        <hr className="newspaper-rule mt-1" />
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.15em] text-muted-foreground py-1.5">
          <span>{dateStr} &middot; ASX Edition</span>
          <span>{user.email}</span>
        </div>
        <hr className="newspaper-rule-thick" />
      </header>

      <div className="mt-6 flex items-center justify-between">
        <h2
          className="font-heading text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading-family)" }}
        >
          Your Watchlists
        </h2>
        <form action="/auth/signout" method="post">
          <Button
            type="submit"
            variant="outline"
            className="text-xs tracking-wider uppercase"
          >
            Sign Out
          </Button>
        </form>
      </div>

      <hr className="newspaper-rule my-4" />

      <div className="mb-6">
        <AddWatchlistForm />
      </div>

      {watchlists.length === 0 ? (
        <div className="border border-border p-8 text-center">
          <h3
            className="font-heading text-xl font-bold"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            No Watchlists Yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Create a watchlist above to start tracking ASX tickers. You will
            receive daily summaries of announcements for every ticker you add.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {watchlists.map((watchlist) => (
            <WatchlistCard key={watchlist.id} watchlist={watchlist} />
          ))}
        </div>
      )}

      <hr className="newspaper-rule-thick mt-10" />
      <p className="mt-4 text-center text-xs text-muted-foreground">
        General information only. Not financial advice. &copy; 2026 Morning
        Money.
      </p>
    </div>
  );
}
