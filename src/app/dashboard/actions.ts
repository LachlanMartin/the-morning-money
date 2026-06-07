"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type WatchlistActionState = { error: string | null };

const ASX_CODE_RE = /^[A-Za-z]{1,3}$/;
const MAX_WATCHLISTS_FREE = 3;
const MAX_TICKERS_FREE = 20;

export async function createWatchlist(
  _prev: WatchlistActionState,
  formData: FormData,
): Promise<WatchlistActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Watchlist name is required." };
  if (name.length > 50) return { error: "Name must be 50 characters or less." };

  const count = await prisma.watchlist.count({ where: { userId: user.id } });
  if (count >= MAX_WATCHLISTS_FREE && user.plan === "FREE") {
    return {
      error: `Free plan allows up to ${MAX_WATCHLISTS_FREE} watchlists. Upgrade to add more.`,
    };
  }

  await prisma.watchlist.create({
    data: { name, userId: user.id },
  });

  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteWatchlist(
  _prev: WatchlistActionState,
  formData: FormData,
): Promise<WatchlistActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Watchlist ID is required." };

  const watchlist = await prisma.watchlist.findUnique({ where: { id } });
  if (!watchlist || watchlist.userId !== user.id) {
    return { error: "Watchlist not found." };
  }

  await prisma.watchlist.delete({ where: { id } });

  revalidatePath("/dashboard");
  return { error: null };
}

export async function addTicker(
  _prev: WatchlistActionState,
  formData: FormData,
): Promise<WatchlistActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const watchlistId = String(formData.get("watchlistId") ?? "");
  const asxCode = String(formData.get("asxCode") ?? "").trim().toUpperCase();

  if (!watchlistId) return { error: "Watchlist ID is required." };
  if (!asxCode) return { error: "ASX code is required." };
  if (!ASX_CODE_RE.test(asxCode)) {
    return { error: "ASX code must be 1–3 letters (e.g. BHP, CBA, TLS)." };
  }

  const watchlist = await prisma.watchlist.findUnique({
    where: { id: watchlistId },
    include: { tickers: true },
  });
  if (!watchlist || watchlist.userId !== user.id) {
    return { error: "Watchlist not found." };
  }

  if (watchlist.tickers.length >= MAX_TICKERS_FREE && user.plan === "FREE") {
    return {
      error: `Free plan allows up to ${MAX_TICKERS_FREE} tickers per watchlist.`,
    };
  }

  if (watchlist.tickers.some((t) => t.asxCode === asxCode)) {
    return { error: `${asxCode} is already in this watchlist.` };
  }

  try {
    await prisma.watchlistTicker.create({
      data: { watchlistId, asxCode },
    });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code: unknown }).code === "P2002"
    ) {
      return { error: `${asxCode} is already in this watchlist.` };
    }
    throw err;
  }

  revalidatePath("/dashboard");
  return { error: null };
}

export async function removeTicker(
  _prev: WatchlistActionState,
  formData: FormData,
): Promise<WatchlistActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Ticker ID is required." };

  const ticker = await prisma.watchlistTicker.findUnique({
    where: { id },
    include: { watchlist: true },
  });
  if (!ticker || ticker.watchlist.userId !== user.id) {
    return { error: "Ticker not found." };
  }

  await prisma.watchlistTicker.delete({ where: { id } });

  revalidatePath("/dashboard");
  return { error: null };
}
