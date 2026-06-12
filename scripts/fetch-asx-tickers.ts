import { readFileSync, writeFileSync } from "node:fs";

interface Ticker {
  code: string;
  name: string;
  sector: string;
}

async function main() {
  const res = await fetch(
    "https://www.asx.com.au/asx/research/ASXListedCompanies.csv",
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const csv = await res.text();
  const lines = csv.trim().split("\n");

  const data: Ticker[] = lines.slice(3).map((line) => {
    const match = line.match(/^"([^"]*)","([^"]+)","([^"]*)"/);
    if (!match) return null;
    return { code: match[2], name: match[1], sector: match[3] || "" };
  }).filter((x): x is Ticker => x !== null);

  writeFileSync("src/data/asx-tickers.json", JSON.stringify(data));
  console.log(`Wrote ${data.length} tickers.`);
}

main();
