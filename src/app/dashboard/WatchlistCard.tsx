"use client";

import { useActionState, useRef, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
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
    <div className="border border-border p-4">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
        <h3
          className="font-heading text-lg font-bold"
          style={{ fontFamily: "var(--font-heading-family)" }}
        >
          {watchlist.name}
        </h3>
        <DeleteWatchlistButton watchlistId={watchlist.id} />
      </div>

      {watchlist.tickers.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {watchlist.tickers.map((ticker) => (
            <TickerBadge
              key={ticker.id}
              tickerId={ticker.id}
              code={ticker.asxCode}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No tickers in this watchlist.
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-border">
        <AddTickerForm watchlistId={watchlist.id} />
      </div>
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
      <span className="inline-flex items-center gap-1 border border-border bg-muted/50 px-2 py-0.5 text-xs font-semibold font-mono uppercase tracking-wider">
        {code}
        <button
          type="submit"
          disabled={pending}
          className="-mr-0.5 inline-flex rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
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
    <form ref={ref} action={action} className="flex items-center gap-2">
      <input type="hidden" name="watchlistId" value={watchlistId} />
      <Input
        name="asxCode"
        placeholder="e.g. BHP"
        className="w-28 h-8 text-xs font-mono uppercase"
        required
      />
      <button
        type="submit"
        disabled={pending}
        className={buttonVariants({
          size: "sm",
          variant: "outline",
          className: "text-xs tracking-wider uppercase h-8",
        })}
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
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
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        aria-label="Delete watchlist"
      >
        <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
      </button>
      {state.error ? (
        <span className="sr-only">{state.error}</span>
      ) : null}
    </form>
  );
}
