"use client";

import { useActionState, useRef, useEffect, useState, useCallback } from "react";
import { X, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addTicker,
  removeTicker,
  renameWatchlist,
  deleteWatchlist,
  type WatchlistActionState,
} from "./actions";

const initial: WatchlistActionState = { error: null };

interface TickerResult {
  code: string;
  name: string;
  sector: string;
}

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
        <EditableName watchlistId={watchlist.id} name={watchlist.name} />
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

function EditableName({
  watchlistId,
  name: initialName,
}: {
  watchlistId: string;
  name: string;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [state, action, pending] = useActionState(renameWatchlist, initial);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const prevError = useRef<string | null>(null);

  useEffect(() => {
    if (prevError.current !== null && state.error === null) {
      setEditing(false);
    }
    prevError.current = state.error;
  }, [state.error]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function save() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === initialName) {
      setName(initialName);
      setEditing(false);
      return;
    }
    formRef.current?.requestSubmit();
  }

  if (editing) {
    return (
      <form ref={formRef} action={action} className="flex-1 min-w-0 mr-2">
        <input type="hidden" name="id" value={watchlistId} />
        <input
          ref={inputRef}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setName(initialName);
              setEditing(false);
            }
          }}
          disabled={pending}
          className="w-full bg-transparent border-b border-ring outline-none font-heading text-xl font-bold pb-0.5"
          style={{ fontFamily: "var(--font-heading-family)" }}
          autoComplete="off"
        />
      </form>
    );
  }

  return (
    <div className="flex items-center">
      <h3
        className="font-heading text-xl font-bold mr-1.5"
        style={{ fontFamily: "var(--font-heading-family)" }}
      >
        {initialName}
      </h3>
      <button
        type="button"
        onClick={() => {
          setName(initialName);
          setEditing(true);
        }}
        className="inline-flex items-center text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
        aria-label="Edit watchlist name"
      >
        <Pencil className="size-3.5" />
      </button>
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
      <span className="group inline-flex items-center gap-1.5 bg-foreground text-background px-2.5 py-1 text-xs font-mono uppercase tracking-wider transition-all duration-150 hover:bg-transparent hover:text-foreground hover:outline hover:outline-1 hover:outline-foreground">
        {code}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex text-background/70 group-hover:text-foreground/70 group-hover:hover:text-foreground disabled:opacity-50 transition-colors"
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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TickerResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const prevError = useRef<string | null>(null);

  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    try {
      const res = await fetch(`/api/tickers/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setOpen(data.length > 0);
      setHighlightIdx(-1);
    } catch {
      setResults([]);
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (prevError.current !== null && state.error === null) {
      ref.current?.reset();
      setQuery("");
      setResults([]);
      setOpen(false);
    }
    prevError.current = state.error;
  }, [state.error]);

  useEffect(() => {
    const timer = setTimeout(() => fetchResults(query), 150);
    return () => clearTimeout(timer);
  }, [query, fetchResults]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function selectTicker(code: string) {
    setQuery(code);
    setOpen(false);
    setResults([]);
    requestAnimationFrame(() => ref.current?.requestSubmit());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      selectTicker(results[highlightIdx].code);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <form ref={ref} action={action} className="flex gap-2">
      <input type="hidden" name="watchlistId" value={watchlistId} />
      <div className="relative flex-1 min-w-0">
        <Input
          ref={inputRef}
          name="asxCode"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="Add ticker (e.g. BHP)"
          className="h-8 text-xs font-mono uppercase placeholder:text-muted-foreground placeholder:normal-case w-full"
          autoComplete="off"
          required
        />
        {open && results.length > 0 && (
          <ul
            ref={listRef}
            className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto border border-border bg-background shadow-lg z-10"
          >
            {results.map((r, i) => (
              <li
                key={r.code}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectTicker(r.code);
                }}
                onMouseEnter={() => setHighlightIdx(i)}
                className={`px-2.5 py-2 text-xs cursor-pointer flex items-center gap-2.5 ${
                  i === highlightIdx
                    ? "bg-foreground text-background"
                    : "hover:bg-surface"
                }`}
              >
                <span className="font-mono font-bold uppercase w-10 shrink-0">
                  {r.code}
                </span>
                <span className="truncate">{r.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground shrink-0 hidden sm:inline">
                  {r.sector}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
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
