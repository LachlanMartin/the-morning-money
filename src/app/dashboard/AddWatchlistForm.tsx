"use client";

import { useActionState, useRef, useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createWatchlist, type WatchlistActionState } from "./actions";

const initial: WatchlistActionState = { error: null };

export function AddWatchlistForm() {
  const [state, action, pending] = useActionState(createWatchlist, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error) ref.current?.reset();
  }, [state.error]);

  return (
    <form ref={ref} action={action} className="flex gap-3 items-center flex-wrap">
      <Input
        name="name"
        placeholder="e.g. Australian Banks, Lithium Miners, ASX200 Defensives"
        className="flex-1 min-w-[200px] h-10 text-sm"
        required
      />
      <button
        type="submit"
        disabled={pending}
        className={buttonVariants({
          className:
            "text-xs font-mono tracking-wider uppercase h-10 whitespace-nowrap transition-all",
        })}
      >
        {pending ? "Creating\u2026" : "Add Watchlist"}
      </button>
      {state.error ? (
        <p className="w-full text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
