import { NextRequest, NextResponse } from "next/server";

// In-memory cache: { [symbol]: { data, timestamp } }
const cache: Record<string, { data: any; ts: number }> = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const TICKER_NAMES: Record<string, string> = {
  "005930.KS": "Samsung Electronics",
  "000660.KS": "SK Hynix",
  GOOGL: "Alphabet (Google)",
  AAPL: "Apple",
  NVDA: "NVIDIA",
  MSFT: "Microsoft",
  TSLA: "Tesla",
  META: "Meta",
  AMZN: "Amazon",
  MU: "Micron",
  AMD: "AMD",
  AVGO: "Broadcom",
  NFLX: "Netflix",
  "035420.KS": "Naver",
  "035720.KS": "Kakao",
};

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  // Check cache first
  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1";
  const cached = cache[symbol];
  if (!forceRefresh && cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const geminiKey = process.env.GEMINI_API_KEY;

  // Try Yahoo Finance first
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=financialData`;
    const yahooRes = await fetch(yahooUrl, { next: { revalidate: 3600 } });
    if (yahooRes.ok) {
      const json = await yahooRes.json();
      const fd = json.quoteSummary?.result?.[0]?.financialData;
      if (fd && fd.targetMeanPrice?.raw > 0) {
        const yahooResult = {
          symbol,
          source: "Yahoo Finance",
          currentPrice: fd.currentPrice?.raw ?? 0,
          targetHigh: fd.targetHighPrice?.raw ?? 0,
          targetLow: fd.targetLowPrice?.raw ?? 0,
          targetMean: fd.targetMeanPrice?.raw ?? 0,
          targetMedian: fd.targetMedianPrice?.raw ?? 0,
          numberOfAnalysts: fd.numberOfAnalystOpinions?.raw ?? 0,
          recommendation: fd.recommendationKey ?? "hold",
          recommendationMean: fd.recommendationMean?.raw ?? 3,
        };
        cache[symbol] = { data: yahooResult, ts: Date.now() };
        return NextResponse.json(yahooResult);
      }
    }
  } catch {}

  // Fallback: Gemini API
  if (!geminiKey) {
    return NextResponse.json({ error: "No data source available" }, { status: 404 });
  }

  try {
    const name = TICKER_NAMES[symbol] ?? symbol;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`;

    // Retry up to 3 times with backoff for rate limits
    let geminiRes: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a financial analyst. For the stock "${name}" (ticker: ${symbol}), provide the current Wall Street analyst consensus as of today.

Return ONLY a JSON object with these fields (no explanation):
{
  "targetHigh": <highest analyst target price in USD or KRW>,
  "targetLow": <lowest analyst target price>,
  "targetMean": <average/consensus target price>,
  "numberOfAnalysts": <approximate number of analysts covering>,
  "recommendation": "buy" or "hold" or "sell",
  "recommendationMean": <1.0 to 5.0 where 1=strong buy, 5=strong sell>,
  "sources": [
    {"name": "<analyst firm>", "target": <price>, "rating": "buy"|"hold"|"sell", "url": "<link to report or news article>"}
  ]
}

Use the most recent publicly available analyst data. Prices should be in the stock's native currency (KRW for Korean stocks, USD for US stocks). Include 3-5 major analyst sources with actual report/article URLs if possible.`
          }]
        }],
        generationConfig: { temperature: 0.1 }
      }),
      });
      if (geminiRes.ok) break;
      if (geminiRes.status === 429 && attempt < 2) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 5000)); // 5s, 10s backoff
        continue;
      }
    }

    if (!geminiRes || !geminiRes.ok) throw new Error(`Gemini ${geminiRes?.status ?? "no response"}`);
    const geminiJson = await geminiRes.json();
    const text = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in Gemini response");

    const parsed = JSON.parse(jsonMatch[0]);

    const result = {
      symbol,
      source: "Gemini AI (analyst consensus)",
      currentPrice: 0,
      targetHigh: parsed.targetHigh ?? 0,
      targetLow: parsed.targetLow ?? 0,
      targetMean: parsed.targetMean ?? 0,
      targetMedian: parsed.targetMean ?? 0,
      numberOfAnalysts: parsed.numberOfAnalysts ?? 0,
      recommendation: parsed.recommendation ?? "hold",
      recommendationMean: parsed.recommendationMean ?? 3,
      sources: parsed.sources ?? [],
    };

    // Cache the result
    cache[symbol] = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (error: any) {
    // Return cached data if available even if stale
    if (cached) return NextResponse.json({ ...cached.data, stale: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
