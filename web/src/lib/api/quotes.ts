import type { Quote } from "@/lib/types";

const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

/**
 * Fetch a real-time quote from Yahoo Finance (unofficial API).
 * Falls back to a stub if the request fails.
 */
export async function fetchQuote(symbol: string): Promise<Quote> {
  try {
    const res = await fetch(`${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=1d`, {
      next: { revalidate: 300 }, // cache 5 min
    });
    if (!res.ok) throw new Error(`Yahoo ${res.status}`);
    const json = await res.json();
    const meta = json.chart.result[0].meta;
    const price = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose ?? meta.previousClose;
    return {
      symbol,
      price,
      change: +(price - prev).toFixed(2),
      changePercent: +(((price - prev) / prev) * 100).toFixed(2),
      volume: meta.regularMarketVolume ?? 0,
      currency: meta.currency ?? "USD",
    };
  } catch {
    return { symbol, price: 0, change: 0, changePercent: 0, volume: 0, currency: "USD" };
  }
}

export async function fetchQuotes(symbols: string[]): Promise<Record<string, Quote>> {
  const results = await Promise.all(symbols.map(fetchQuote));
  return Object.fromEntries(results.map((q) => [q.symbol, q]));
}
