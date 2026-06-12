"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isTrialExpired } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type WatchlistActionState = { error: string | null };

const ASX_CODE_RE = /^[A-Za-z]{1,3}$/;

const LIMITS = {
  FREE: {
    maxDistinctTickers: 20,
  },
  PAID: {
    maxDistinctTickers: 150,
  },
} as const;

type AuthedUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

async function requireActiveUser(): Promise<AuthedUser | WatchlistActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };
  if (isTrialExpired(user)) return { error: "Your free trial has ended. Upgrade to Pro to continue." };
  return user;
}

export async function createWatchlist(
  _prev: WatchlistActionState,
  formData: FormData,
): Promise<WatchlistActionState> {
  const user = await requireActiveUser();
  if ("error" in user) return user;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Watchlist name is required." };
  if (name.length > 50) return { error: "Name must be 50 characters or less." };

  await prisma.watchlist.create({
    data: { name, userId: user.id },
  });

  revalidatePath("/dashboard");
  return { error: null };
}

export async function renameWatchlist(
  _prev: WatchlistActionState,
  formData: FormData,
): Promise<WatchlistActionState> {
  const result = await requireActiveUser();
  if ("error" in result) return result;

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id) return { error: "Watchlist ID is required." };
  if (!name) return { error: "Name is required." };
  if (name.length > 50) return { error: "Name must be 50 characters or less." };

  const watchlist = await prisma.watchlist.findUnique({ where: { id } });
  if (!watchlist || watchlist.userId !== result.id) {
    return { error: "Watchlist not found." };
  }

  await prisma.watchlist.update({ where: { id }, data: { name } });

  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteWatchlist(
  _prev: WatchlistActionState,
  formData: FormData,
): Promise<WatchlistActionState> {
  const result = await requireActiveUser();
  if ("error" in result) return result;

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Watchlist ID is required." };

  const watchlist = await prisma.watchlist.findUnique({ where: { id } });
  if (!watchlist || watchlist.userId !== result.id) {
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
  const result = await requireActiveUser();
  if ("error" in result) return result;

  const watchlistId = String(formData.get("watchlistId") ?? "");
  const asxCode = String(formData.get("asxCode") ?? "").trim().toUpperCase();

  if (!watchlistId) return { error: "Watchlist ID is required." };
  if (!asxCode) return { error: "ASX code is required." };
  if (!ASX_CODE_RE.test(asxCode)) {
    return { error: "ASX code must be 1\u20133 letters (e.g. BHP, CBA, TLS)." };
  }

  const watchlist = await prisma.watchlist.findUnique({
    where: { id: watchlistId },
    include: { tickers: true },
  });
  if (!watchlist || watchlist.userId !== result.id) {
    return { error: "Watchlist not found." };
  }

  const limit = result.plan === "FREE" ? LIMITS.FREE : LIMITS.PAID;

  const existingDistinct = await prisma.watchlistTicker.findMany({
    where: { watchlist: { userId: result.id } },
    select: { asxCode: true },
    distinct: ["asxCode"],
  });

  const alreadyWatching = existingDistinct.some((t) => t.asxCode === asxCode);
  if (!alreadyWatching && existingDistinct.length >= limit.maxDistinctTickers) {
    return {
      error: `Your plan allows up to ${limit.maxDistinctTickers} distinct tickers across all watchlists.`,
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
  const result = await requireActiveUser();
  if ("error" in result) return result;

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Ticker ID is required." };

  const ticker = await prisma.watchlistTicker.findUnique({
    where: { id },
    include: { watchlist: true },
  });
  if (!ticker || ticker.watchlist.userId !== result.id) {
    return { error: "Ticker not found." };
  }

  await prisma.watchlistTicker.delete({ where: { id } });

  revalidatePath("/dashboard");
  return { error: null };
}
