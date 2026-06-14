import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface WatchlistSeed {
  name: string;
  tickers: string[];
}

const WATCHLISTS: WatchlistSeed[] = [
  {
    name: "Big Miners",
    tickers: ["BHP", "RIO", "FMG", "S32", "MIN", "OZL"],
  },
  {
    name: "Big Banks",
    tickers: ["CBA", "WBC", "NAB", "ANZ", "BEN", "BOQ"],
  },
  {
    name: "Energy",
    tickers: ["WDS", "STO", "ALA", "KAR", "BPT", "BEACH"],
  },
  {
    name: "Gold & Precious",
    tickers: ["NST", "EVN", "NEM", "RMS", "SAR", "PRU"],
  },
  {
    name: "Healthcare",
    tickers: ["CSL", "COH", "RHC", "SHL", "PME", "FPH"],
  },
  {
    name: "Tech & Telco",
    tickers: ["TLS", "XRO", "REA", "CAR", "WTC", "NEC"],
  },
  {
    name: "Retail & Consumer",
    tickers: ["WOW", "COL", "WES", "JBH", "TLS", "FLT"],
  },
  {
    name: "Infrastructure & Industrials",
    tickers: ["QAN", "SYD", "TCL", "ALL", "AMC"],
  },
];

async function getLocalUserId(): Promise<string> {
  const email = process.env.LOCAL_USER_EMAIL;
  if (!email) throw new Error("LOCAL_USER_EMAIL is required");

  const { rows } = await pool.query(
    'SELECT id FROM "User" WHERE email = $1',
    [email],
  );
  if (rows.length === 0) throw new Error(`User not found: ${email}`);
  return rows[0].id;
}

function tickerExistsInSeen(set: Set<string>, ticker: string): boolean {
  if (set.has(ticker)) return true;
  set.add(ticker);
  return false;
}

async function main() {
  const userId = await getLocalUserId();
  const seenTickers = new Set<string>();
  let createdWatchlists = 0;
  let createdTickers = 0;

  for (const wl of WATCHLISTS) {
    const { rows } = await pool.query(
      'INSERT INTO "Watchlist" (id, "userId", name, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, NOW(), NOW()) RETURNING id',
      [userId, wl.name],
    );
    const watchlistId = rows[0].id;
    createdWatchlists++;

    for (const code of wl.tickers) {
      try {
        await pool.query(
          'INSERT INTO "WatchlistTicker" (id, "watchlistId", "asxCode", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())',
          [watchlistId, code],
        );
        if (!tickerExistsInSeen(seenTickers, code)) {
          createdTickers++;
        }
      } catch (err: unknown) {
        if (err instanceof Error && "code" in err && (err as { code: unknown }).code === "23505") {
          console.log(`  ↳ ${code} already in this watchlist, skipping`);
        } else {
          throw err;
        }
      }
    }

    console.log(`  ✓ ${wl.name} (${wl.tickers.length} tickers)`);
  }

  console.log(`\nDone. ${createdWatchlists} watchlists, ${createdTickers} unique tickers.`);
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
