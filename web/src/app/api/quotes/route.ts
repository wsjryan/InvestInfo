import { NextRequest, NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/api/quotes";

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols");
  if (!symbols) {
    return NextResponse.json({ error: "symbols parameter required" }, { status: 400 });
  }
  const list = symbols.split(",").map((s) => s.trim()).filter(Boolean);
  const quotes = await fetchQuotes(list);
  return NextResponse.json(quotes);
}
