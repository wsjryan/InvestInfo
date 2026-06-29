import { NextRequest, NextResponse } from "next/server";
import { TICKER_NAMES } from "@/lib/tickers";

const cache: Record<string, { data: any; ts: number }> = {};
const CACHE_TTL = 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1";
  const cached = cache[symbol];
  if (!forceRefresh && cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return NextResponse.json({ error: "No API key" }, { status: 500 });

  // Get current price from Yahoo
  let priceInfo = "";
  try {
    const qRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`, { cache: "no-store" });
    if (qRes.ok) {
      const qJson = await qRes.json();
      const meta = qJson.chart?.result?.[0]?.meta;
      if (meta) priceInfo = `Current price: ${meta.currency} ${meta.regularMarketPrice}. Previous close: ${meta.chartPreviousClose}.`;
    }
  } catch {}

  const name = TICKER_NAMES[symbol] ?? symbol;
  const now = new Date().toISOString();

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

    let res: Response | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a senior investment analyst. Current: ${now} (UTC). Analyze "${name}" (${symbol}). ${priceInfo}

Return ONLY JSON:
{
  "verdict": "strong_buy"|"buy"|"hold"|"sell"|"strong_sell",
  "confidence": <0-100>,
  "verdictSummary": "<2 sentences Korean>",
  "aiSentiment": "positive"|"negative"|"neutral",
  "aiSummary": "<3 sentences Korean covering macro+industry+stock>",
  "macro": {"score":<-1 to 1>,"positive":[{"text":"<Korean ≤25chars>","source":"<name>","sourceUrl":"<Google News search URL>","date":"<MM/DD HH:MM>"}],"negative":[...]},
  "industry": {"score":<-1 to 1>,"positive":[...],"negative":[...]},
  "stock": {"score":<-1 to 1>,"positive":[...],"negative":[...]},
  "events": [{"date":"<MM/DD>","title":"<name>","type":"earnings"|"conference"|"economic"|"policy"|"product","impact":"high"|"medium"|"low","axis":"macro"|"industry"|"stock","description":"<Korean>","url":"<URL>","daysUntil":<num>}],
  "targetHigh": <number>, "targetLow": <number>, "targetMean": <number>,
  "numberOfAnalysts": <number>,
  "recommendation": "buy"|"hold"|"sell",
  "recommendationMean": <1.0-5.0>,
  "reasoning": "<Korean: [매크로] ... → [산업] ... → [종목] ... → [총평] ...>",
  "analystSources": [{"name":"<firm>","target":<price>,"rating":"buy"|"hold"|"sell","reason":"<1 sentence Korean>","url":"<Google News search URL for this report>"}]
}

Rules:
- IMPORTANT: You are analyzing ONLY "${name}" (${symbol}). All factors, verdict, summary must be about THIS specific stock, not other companies.
- Each axis: 2-4 factors. sourceUrl = Google News search for actual article.
- Target prices realistic vs current price (±30%). KRW for .KS, USD for US.
- reasoning: [매크로]→[산업]→[종목]→[총평] sections. 종목 section must focus on ${name} specifically.
- analystSources: 3-5 firms with reasons about ${name}. URLs = Google News search, NOT homepages.
- events: 3-5 items within 30 days relevant to ${name}.
- Be balanced.`
            }]
          }],
          generationConfig: { temperature: 0.2 }
        }),
      });
      if (res.ok) break;
      if (res.status === 429 && attempt < 1) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
    }

    if (!res || !res.ok) throw new Error(`Gemini ${res?.status}`);
    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");

    const p = JSON.parse(match[0]);

    const result = {
      symbol, queryTime: now,
      // Analysis
      verdict: p.verdict ?? "hold",
      confidence: p.confidence ?? 50,
      verdictSummary: p.verdictSummary ?? "",
      aiSentiment: p.aiSentiment ?? "neutral",
      aiSummary: p.aiSummary ?? "",
      macro: p.macro ?? { score: 0, positive: [], negative: [] },
      industry: p.industry ?? { score: 0, positive: [], negative: [] },
      stock: p.stock ?? { score: 0, positive: [], negative: [] },
      events: p.events ?? [],
      // Target price
      source: "Gemini AI",
      targetHigh: p.targetHigh ?? 0,
      targetLow: p.targetLow ?? 0,
      targetMean: p.targetMean ?? 0,
      targetMedian: p.targetMean ?? 0,
      numberOfAnalysts: p.numberOfAnalysts ?? 0,
      recommendation: p.recommendation ?? "hold",
      recommendationMean: p.recommendationMean ?? 3,
      reasoning: p.reasoning ?? "",
      sources: p.analystSources ?? [],
    };

    cache[symbol] = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (error: any) {
    if (cached) return NextResponse.json({ ...cached.data, stale: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
