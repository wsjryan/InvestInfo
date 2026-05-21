import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  try {
    // Yahoo Finance quoteSummary — financialData module has targetHighPrice, targetLowPrice, targetMeanPrice
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=financialData`;
    const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1hr
    if (!res.ok) throw new Error(`Yahoo ${res.status}`);
    const json = await res.json();

    const fd = json.quoteSummary?.result?.[0]?.financialData;
    if (!fd) throw new Error("No financial data");

    return NextResponse.json({
      symbol,
      currentPrice: fd.currentPrice?.raw ?? 0,
      targetHigh: fd.targetHighPrice?.raw ?? 0,
      targetLow: fd.targetLowPrice?.raw ?? 0,
      targetMean: fd.targetMeanPrice?.raw ?? 0,
      targetMedian: fd.targetMedianPrice?.raw ?? 0,
      numberOfAnalysts: fd.numberOfAnalystOpinions?.raw ?? 0,
      recommendation: fd.recommendationKey ?? "hold", // e.g. "buy", "hold", "sell"
      recommendationMean: fd.recommendationMean?.raw ?? 3, // 1=strong buy, 5=strong sell
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
