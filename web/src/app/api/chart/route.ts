import { NextRequest, NextResponse } from "next/server";

const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  const range = req.nextUrl.searchParams.get("range") ?? "1mo";
  const interval = req.nextUrl.searchParams.get("interval") ?? "1d";

  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  try {
    const url = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
    const res = await fetch(url, { next: { revalidate: 30 } }); // refresh every 30s
    if (!res.ok) throw new Error(`Yahoo ${res.status}`);
    const json = await res.json();

    const result = json.chart.result?.[0];
    if (!result) throw new Error("No data");

    const timestamps = result.timestamp ?? [];
    const ohlc = result.indicators?.quote?.[0] ?? {};

    const candles = timestamps.map((t: number, i: number) => ({
      time: t,
      open: ohlc.open?.[i] ?? 0,
      high: ohlc.high?.[i] ?? 0,
      low: ohlc.low?.[i] ?? 0,
      close: ohlc.close?.[i] ?? 0,
      volume: ohlc.volume?.[i] ?? 0,
    })).filter((c: any) => c.close > 0);

    return NextResponse.json({
      symbol,
      currency: result.meta?.currency ?? "USD",
      candles,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
