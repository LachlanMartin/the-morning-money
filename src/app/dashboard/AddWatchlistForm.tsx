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
    <form ref={ref} action={action} className="flex items-center gap-2">
      <Input
        name="name"
        placeholder="New watchlist name"
        className="w-48 h-8 text-sm"
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
        {pending ? "Creating…" : "Create"}
      </button>
      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
