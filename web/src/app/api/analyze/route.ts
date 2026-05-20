import { NextRequest, NextResponse } from "next/server";
import { fetchNewsRSS } from "@/lib/api/news";
import { fetchQuote } from "@/lib/api/quotes";
import { classifyNews, generateAnalysis } from "@/lib/api/ai-analyze";
import { createClient } from "@supabase/supabase-js";

// Ticker metadata for search queries
const TICKER_META: Record<string, { name: string; sector: string; queries: string[] }> = {
  "005930.KS": {
    name: "Samsung Electronics",
    sector: "Semiconductors",
    queries: ["삼성전자", "Samsung Electronics semiconductor"],
  },
  "000660.KS": {
    name: "SK Hynix",
    sector: "Semiconductors",
    queries: ["SK하이닉스", "SK Hynix HBM memory"],
  },
  GOOGL: {
    name: "Alphabet (Google)",
    sector: "Tech / Search / Cloud",
    queries: ["Google Alphabet", "구글 AI"],
  },
  AAPL: {
    name: "Apple",
    sector: "Consumer Electronics",
    queries: ["Apple iPhone", "애플"],
  },
  NVDA: {
    name: "NVIDIA",
    sector: "Semiconductors / AI",
    queries: ["NVIDIA AI GPU", "엔비디아"],
  },
  MSFT: {
    name: "Microsoft",
    sector: "Tech / Cloud",
    queries: ["Microsoft Azure AI", "마이크로소프트"],
  },
  TSLA: {
    name: "Tesla",
    sector: "EV / Energy",
    queries: ["Tesla EV", "테슬라"],
  },
  "035420.KS": {
    name: "Naver",
    sector: "Tech / Search",
    queries: ["네이버", "Naver"],
  },
  "035720.KS": {
    name: "Kakao",
    sector: "Tech / Platform",
    queries: ["카카오", "Kakao"],
  },
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker parameter required" }, { status: 400 });
  }

  const meta = TICKER_META[ticker];
  if (!meta) {
    return NextResponse.json({ error: `Unknown ticker: ${ticker}` }, { status: 400 });
  }

  try {
    // 1. Fetch news from multiple queries
    const allRSS = await Promise.all(
      meta.queries.map((q) => fetchNewsRSS(q))
    );
    const rawArticles = allRSS.flat().slice(0, 20);

    const articles = rawArticles.map((item) => ({
      title: item.title,
      source: item.source,
      sourceUrl: item.link || undefined,
      time: item.pubDate
        ? new Date(item.pubDate).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
        : "",
    }));

    // 2. Fetch quote
    const quote = await fetchQuote(ticker);

    // 3. AI classify news
    const classified = await classifyNews(articles, ticker, meta.sector);

    // 4. AI generate analysis
    const analysis = await generateAnalysis(
      ticker,
      meta.name,
      meta.sector,
      classified,
      quote.price > 0 ? { price: quote.price, change: quote.change, changePercent: quote.changePercent } : undefined
    );

    // 5. Build response
    const today = new Date().toISOString().split("T")[0];
    const report = {
      ticker,
      name: meta.name,
      period: "daily",
      date: today,
      verdict: analysis.verdict,
      aiSummary: analysis.aiSummary,
      macro: {
        positive: analysis.macroFactors.filter((f) => f.sentiment === "positive"),
        negative: analysis.macroFactors.filter((f) => f.sentiment === "negative"),
      },
      industry: {
        positive: analysis.industryFactors.filter((f) => f.sentiment === "positive"),
        negative: analysis.industryFactors.filter((f) => f.sentiment === "negative"),
      },
      stock: {
        positive: analysis.stockFactors.filter((f) => f.sentiment === "positive"),
        negative: analysis.stockFactors.filter((f) => f.sentiment === "negative"),
      },
      news: classified,
      quote: quote.price > 0 ? quote : undefined,
      updatedAt: new Date().toISOString(),
    };

    // 6. Save to Supabase (if service role key available)
    const sb = getSupabaseAdmin();
    if (sb) {
      await sb.from("reports").upsert(
        {
          ticker,
          period_type: "daily",
          period_date: today,
          verdict: analysis.verdict.verdict,
          verdict_confidence: analysis.verdict.confidence,
          verdict_summary: analysis.verdict.summary,
          ai_sentiment: analysis.aiSummary.sentiment,
          ai_summary: analysis.aiSummary.summary,
          macro_factors: analysis.macroFactors,
          industry_factors: analysis.industryFactors,
          stock_factors: analysis.stockFactors,
        },
        { onConflict: "ticker,period_type,period_date" }
      ).then(({ error }) => {
        if (error) console.error("Failed to save report:", error.message);
      });
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Analysis failed:", error);
    return NextResponse.json(
      { error: "Analysis failed", message: error.message },
      { status: 500 }
    );
  }
}
