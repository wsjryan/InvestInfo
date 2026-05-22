import { NextRequest, NextResponse } from "next/server";

const TICKER_NAMES: Record<string, string> = {
  "005930.KS": "Samsung Electronics", "000660.KS": "SK Hynix", GOOGL: "Alphabet (Google)",
  AAPL: "Apple", NVDA: "NVIDIA", MSFT: "Microsoft", TSLA: "Tesla", META: "Meta",
  AMZN: "Amazon", MU: "Micron", AMD: "AMD", AVGO: "Broadcom", TSM: "TSMC",
  NFLX: "Netflix", "035420.KS": "Naver", "035720.KS": "Kakao",
};

const cache: Record<string, { data: any; ts: number }> = {};
const CACHE_TTL = 60 * 60 * 1000; // 1hr

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

  // Get current price
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
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`;

    let res: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a senior investment analyst. Current datetime: ${now} (UTC).
Analyze "${name}" (${symbol}). ${priceInfo}

Return ONLY a JSON object:
{
  "verdict": "strong_buy"|"buy"|"hold"|"sell"|"strong_sell",
  "confidence": <0-100>,
  "verdictSummary": "<2 sentences in Korean: overall investment recommendation>",
  "aiSentiment": "positive"|"negative"|"neutral",
  "aiSummary": "<3 sentences in Korean: comprehensive summary covering macro, industry, stock factors>",
  "macro": {
    "score": <-1.0 to 1.0>,
    "positive": [{"text":"<Korean, concise>","source":"<name>","sourceUrl":"<Google News search URL>","date":"<MM/DD HH:MM>"}],
    "negative": [{"text":"...","source":"...","sourceUrl":"...","date":"..."}]
  },
  "industry": { "score": <-1.0 to 1.0>, "positive": [...], "negative": [...] },
  "stock": { "score": <-1.0 to 1.0>, "positive": [...], "negative": [...] },
  "events": [
    {"date":"<MM/DD>","title":"<event name>","type":"earnings"|"conference"|"economic"|"policy"|"product","impact":"high"|"medium"|"low","axis":"macro"|"industry"|"stock","description":"<Korean>","url":"<relevant URL>","daysUntil":<number>}
  ]
}

Rules:
- Each axis: 2-4 factors (mix positive/negative). Texts under 25 chars Korean.
- sourceUrl: Google News search URL for actual articles, not homepages.
- date: use recent real dates for factors.
- events: upcoming 30 days, 3-5 items. Include earnings, FOMC, industry conferences etc.
- verdict and summaries in Korean.
- Be balanced — acknowledge both bull and bear cases.`
            }]
          }],
          generationConfig: { temperature: 0.2 }
        }),
      });
      if (res.ok) break;
      if (res.status === 429 && attempt < 2) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 5000));
        continue;
      }
    }

    if (!res || !res.ok) throw new Error(`Gemini ${res?.status}`);
    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");

    const parsed = JSON.parse(match[0]);

    const result = {
      symbol,
      queryTime: now,
      verdict: parsed.verdict ?? "hold",
      confidence: parsed.confidence ?? 50,
      verdictSummary: parsed.verdictSummary ?? "",
      aiSentiment: parsed.aiSentiment ?? "neutral",
      aiSummary: parsed.aiSummary ?? "",
      macro: parsed.macro ?? { score: 0, positive: [], negative: [] },
      industry: parsed.industry ?? { score: 0, positive: [], negative: [] },
      stock: parsed.stock ?? { score: 0, positive: [], negative: [] },
      events: parsed.events ?? [],
    };

    cache[symbol] = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (error: any) {
    if (cached) return NextResponse.json({ ...cached.data, stale: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
