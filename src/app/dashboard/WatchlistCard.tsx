"use client";

import { useActionState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addTicker,
  removeTicker,
  deleteWatchlist,
  type WatchlistActionState,
} from "./actions";

const initial: WatchlistActionState = { error: null };

type WatchlistWithTickers = {
  id: string;
  name: string;
  tickers: { id: string; asxCode: string }[];
};

export function WatchlistCard({
  watchlist,
}: {
  watchlist: WatchlistWithTickers;
}) {
  return (
    <div className="border border-border bg-surface p-5 transition-colors duration-150 hover:border-foreground">
      <div className="flex items-center justify-between mb-3">
        <h3
          className="font-heading text-xl font-bold"
          style={{ fontFamily: "var(--font-heading-family)" }}
        >
          {watchlist.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono tracking-wider text-muted-foreground">
            {watchlist.tickers.length}
          </span>
          <DeleteWatchlistButton watchlistId={watchlist.id} />
        </div>
      </div>

      {watchlist.tickers.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
          {watchlist.tickers.map((ticker) => (
            <TickerBadge
              key={ticker.id}
              tickerId={ticker.id}
              code={ticker.asxCode}
            />
          ))}
        </div>
      ) : (
        <div className="mb-4 min-h-[32px]">
          <p className="text-sm text-muted-foreground italic">
            No tickers in this watchlist.
          </p>
        </div>
      )}

      <AddTickerForm watchlistId={watchlist.id} />
    </div>
  );
}

function TickerBadge({
  tickerId,
  code,
}: {
  tickerId: string;
  code: string;
}) {
  const [state, action, pending] = useActionState(removeTicker, initial);

  return (
    <form action={action} className="inline-flex">
      <input type="hidden" name="id" value={tickerId} />
      <span className="inline-flex items-center gap-1.5 bg-foreground text-background px-2.5 py-1 text-xs font-mono uppercase tracking-wider transition-all duration-150 hover:bg-transparent hover:text-foreground hover:outline hover:outline-1 hover:outline-foreground">
        {code}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex text-background/70 hover:text-background disabled:opacity-50 transition-colors"
          aria-label={`Remove ${code}`}
        >
          <X className="size-3" />
        </button>
      </span>
      {state.error ? (
        <span className="sr-only">{state.error}</span>
      ) : null}
    </form>
  );
}

function AddTickerForm({ watchlistId }: { watchlistId: string }) {
  const [state, action, pending] = useActionState(addTicker, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error) ref.current?.reset();
  }, [state.error]);

  return (
    <form
      ref={ref}
      action={action}
      className="flex gap-2"
    >
      <input type="hidden" name="watchlistId" value={watchlistId} />
      <Input
        name="asxCode"
        placeholder="Add ticker (e.g. BHP)"
        className="h-8 text-xs font-mono uppercase placeholder:text-muted-foreground placeholder:normal-case flex-1 min-w-0"
        required
      />
      <button
        type="submit"
        disabled={pending}
        className={buttonVariants({
          size: "sm",
          className:
            "text-xs font-mono tracking-wider uppercase h-8 transition-all",
        })}
      >
        {pending ? "Adding\u2026" : "Add"}
      </button>
      {state.error ? (
        <p className="text-xs text-destructive sr-only">{state.error}</p>
      ) : null}
    </form>
  );
}

function DeleteWatchlistButton({ watchlistId }: { watchlistId: string }) {
  const [state, action, pending] = useActionState(deleteWatchlist, initial);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={watchlistId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-danger transition-colors bg-transparent border-none cursor-pointer p-1"
        aria-label="Delete watchlist"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      </button>
      {state.error ? (
        <span className="sr-only">{state.error}</span>
      ) : null}
    </form>
  );
}
