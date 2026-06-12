import tickers from "@/data/asx-tickers.json";

interface Ticker {
  code: string;
  name: string;
  sector: string;
}

let cached: Ticker[] | null = null;

function getTickers(): Ticker[] {
  if (!cached) cached = tickers as Ticker[];
  return cached;
}

export function searchTickers(query: string, limit = 8): Ticker[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return getTickers()
    .filter(
      (t) =>
        t.code.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.sector.toLowerCase().includes(q),
    )
    .sort((a, b) => {
      const aExact = a.code.toLowerCase() === q ? 0 : 1;
      const bExact = b.code.toLowerCase() === q ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      const aStarts = a.code.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.code.toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts || a.code.localeCompare(b.code);
    })
    .slice(0, limit);
}
