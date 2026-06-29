import { NextRequest, NextResponse } from "next/server";
import { fetchNewsRSS } from "@/lib/api/news";
import { TICKER_NAMES } from "@/lib/tickers";

// "Why is the stock moving today, right now" — a light, fast Gemini call
// kept separate from the heavy /api/analysis (verdict + 3-axis + targets).
const cache: Record<string, { data: any; ts: number }> = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 min

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

  const name = TICKER_NAMES[symbol] ?? symbol;
  const isKR = symbol.endsWith(".KS") || symbol.endsWith(".KQ");

  // 1. Today's price snapshot from Yahoo
  let price = 0, prevClose = 0, currency = isKR ? "KRW" : "USD", marketState = "", changePercent = 0;
  try {
    const qRes = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d`,
      { cache: "no-store" }
    );
    if (qRes.ok) {
      const qJson = await qRes.json();
      const meta = qJson.chart?.result?.[0]?.meta;
      if (meta) {
        price = meta.regularMarketPrice ?? 0;
        prevClose = meta.chartPreviousClose ?? meta.previousClose ?? 0;
        currency = meta.currency ?? currency;
        marketState = meta.marketState ?? "";
        if (prevClose) changePercent = +(((price - prevClose) / prevClose) * 100).toFixed(2);
      }
    }
  } catch {}

  // 2. Recent news headlines (grounding — avoids hallucinated reasons)
  const newsItems = await fetchNewsRSS(name, isKR ? "ko" : "en");
  const newsForPrompt = newsItems.slice(0, 10);
  const headlines = newsForPrompt
    .map((n, i) => `${i + 1}. ${n.title} (${n.source})`)
    .join("\n");

  const dir = changePercent > 0.1 ? "상승" : changePercent < -0.1 ? "하락" : "보합";
  const now = new Date().toISOString();

  // 3. Gemini — short, grounded explanation
  try {
    const prompt = `You are a senior market analyst. Current time: ${now} (UTC).
Today ${name} (${symbol}) is trading at ${currency} ${price} vs previous close ${currency} ${prevClose} — change ${changePercent}% (${dir}). Market state: ${marketState || "unknown"}.

Recent news headlines (most recent first):
${headlines || "(no recent headlines available)"}

Explain WHY ${name} is moving ${dir} right now today, grounded ONLY in the headlines above and the price move. If the headlines don't clearly explain the move, say it is likely driven by broader market/sector flows and mark it as 추정.

Return ONLY JSON:
{
  "direction": "up"|"down"|"flat",
  "headline": "<Korean one-line ≤30 chars summarizing today's move reason>",
  "summary": "<2-3 sentences Korean explaining today's intraday move>",
  "drivers": [<headline numbers, 1-3, that most directly explain today's move — e.g. [1, 3]>]
}

Rules:
- drivers: 1-3 NUMBERS referencing the headlines above (their leading number), NOT text. Pick the ones that most directly explain today's move.
- Korean. Be specific to ${name}, NOT generic market commentary.
- If uncertain, hedge with 추정/관측 — do NOT invent facts.`;

    // Lightweight task → lighter model. Also keeps this on a separate
    // per-model daily free-tier quota from the heavy /api/analysis call.
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`;
    let res: Response | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
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

    // Map returned headline indices back to the real news articles
    // (title / source / published time / link) so the UI can render them
    // like the News timeline rows.
    const drivers = (Array.isArray(p.drivers) ? p.drivers : [])
      .map((d: any) => (typeof d === "number" ? d : d?.index ?? d?.newsIndex ?? d?.id))
      .map((idx: any) => newsForPrompt[Number(idx) - 1])
      .filter(Boolean)
      .slice(0, 3)
      .map((n: any) => ({
        title: n.title,
        source: n.source,
        time: n.pubDate ? new Date(n.pubDate).toISOString() : "",
        url: n.link || "",
      }));

    const result = {
      symbol,
      asOf: now,
      price,
      prevClose,
      currency,
      changePercent,
      marketState,
      direction: p.direction ?? (changePercent >= 0 ? "up" : "down"),
      headline: p.headline ?? "",
      summary: p.summary ?? "",
      drivers,
    };

    cache[symbol] = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (error: any) {
    // Gemini failed (commonly 429 rate limit). Still return the factual price
    // move so the block shows the % change; reasoning is best-effort + retryable.
    if (price) {
      return NextResponse.json({
        symbol, asOf: now, price, prevClose, currency, changePercent, marketState,
        direction: changePercent > 0.1 ? "up" : changePercent < -0.1 ? "down" : "flat",
        headline: "", summary: "", drivers: [],
        reasonUnavailable: true,
      });
    }
    if (cached) return NextResponse.json({ ...cached.data, stale: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
