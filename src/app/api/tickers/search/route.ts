import { NextResponse } from "next/server";
import { searchTickers } from "@/lib/asx-tickers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const results = searchTickers(q);
  return NextResponse.json(results);
}
