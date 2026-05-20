import Anthropic from "@anthropic-ai/sdk";
import type { Factor, NewsArticle, Verdict, Sentiment } from "@/lib/types";

const getClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  return new Anthropic({ apiKey });
};

// ─── 1. Classify news into 3 axes + sentiment ───────────────

interface ClassifiedArticle extends NewsArticle {
  axis: "macro" | "industry" | "stock";
  sentiment: "positive" | "negative" | "neutral";
}

export async function classifyNews(
  articles: { title: string; source: string; sourceUrl?: string; time: string }[],
  ticker: string,
  sector: string
): Promise<ClassifiedArticle[]> {
  if (articles.length === 0) return [];

  const client = getClient();
  const articleList = articles
    .map((a, i) => `${i + 1}. [${a.source}] ${a.title}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a financial analyst. Classify each news headline for the stock ${ticker} (sector: ${sector}).

For each article, determine:
1. axis: "macro" (macroeconomic/policy/geopolitical), "industry" (sector/industry-wide), or "stock" (company-specific)
2. sentiment: "positive" (bullish for the stock), "negative" (bearish), or "neutral"

Articles:
${articleList}

Respond ONLY with a JSON array. Each element: {"index": <1-based>, "axis": "...", "sentiment": "..."}
No explanation, just the JSON array.`,
      },
    ],
  });

  try {
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return articles.map((a) => ({ ...a, axis: "stock" as const, sentiment: "neutral" as const }));

    const classifications: { index: number; axis: string; sentiment: string }[] = JSON.parse(jsonMatch[0]);

    return articles.map((a, i) => {
      const c = classifications.find((cl) => cl.index === i + 1);
      return {
        ...a,
        axis: (c?.axis as "macro" | "industry" | "stock") ?? "stock",
        sentiment: (c?.sentiment as "positive" | "negative" | "neutral") ?? "neutral",
      };
    });
  } catch {
    return articles.map((a) => ({ ...a, axis: "stock" as const, sentiment: "neutral" as const }));
  }
}

// ─── 2. Generate 3-axis factors + verdict + summary ──────────

interface AnalysisResult {
  verdict: { verdict: Verdict; confidence: number; summary: string };
  aiSummary: { sentiment: Sentiment; summary: string };
  macroFactors: Factor[];
  industryFactors: Factor[];
  stockFactors: Factor[];
}

export async function generateAnalysis(
  ticker: string,
  tickerName: string,
  sector: string,
  classifiedNews: ClassifiedArticle[],
  quoteInfo?: { price: number; change: number; changePercent: number }
): Promise<AnalysisResult> {
  const client = getClient();

  const macroNews = classifiedNews.filter((n) => n.axis === "macro");
  const industryNews = classifiedNews.filter((n) => n.axis === "industry");
  const stockNews = classifiedNews.filter((n) => n.axis === "stock");

  const formatNewsList = (news: ClassifiedArticle[]) =>
    news.length === 0
      ? "No relevant news"
      : news.map((n) => `- [${n.sentiment}] ${n.title} (${n.source})`).join("\n");

  const priceInfo = quoteInfo
    ? `Current price: ${quoteInfo.price}, Change: ${quoteInfo.change} (${quoteInfo.changePercent}%)`
    : "Price data unavailable";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `You are a senior investment analyst. Analyze ${tickerName} (${ticker}, sector: ${sector}).

${priceInfo}

=== MACRO NEWS ===
${formatNewsList(macroNews)}

=== INDUSTRY NEWS ===
${formatNewsList(industryNews)}

=== STOCK NEWS ===
${formatNewsList(stockNews)}

Based on this information, produce a JSON analysis with this exact structure:
{
  "verdict": {
    "verdict": "strong_buy" | "buy" | "hold" | "sell" | "strong_sell",
    "confidence": <0-100>,
    "summary": "<1-2 sentences in Korean explaining the verdict>"
  },
  "aiSummary": {
    "sentiment": "positive" | "negative" | "neutral",
    "summary": "<2-3 sentences in Korean summarizing all 3 axes>"
  },
  "macroFactors": [
    {"text": "<factor in Korean>", "source": "<source name>", "sentiment": "positive" | "negative"}
  ],
  "industryFactors": [...],
  "stockFactors": [...]
}

Rules:
- Each axis should have 2-4 factors (mix of positive and negative)
- Factors should be concise (under 30 chars Korean)
- Summary and verdict should be in Korean
- Be balanced — acknowledge both bull and bear cases
- Respond ONLY with the JSON, no explanation`,
      },
    ],
  });

  try {
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const result = JSON.parse(jsonMatch[0]);

    return {
      verdict: result.verdict,
      aiSummary: result.aiSummary,
      macroFactors: (result.macroFactors ?? []).map((f: any) => ({
        ...f,
        axis: "macro" as const,
      })),
      industryFactors: (result.industryFactors ?? []).map((f: any) => ({
        ...f,
        axis: "industry" as const,
      })),
      stockFactors: (result.stockFactors ?? []).map((f: any) => ({
        ...f,
        axis: "stock" as const,
      })),
    };
  } catch {
    return {
      verdict: { verdict: "hold", confidence: 50, summary: "분석 데이터 부족" },
      aiSummary: { sentiment: "neutral", summary: "충분한 데이터를 수집하지 못했습니다." },
      macroFactors: [],
      industryFactors: [],
      stockFactors: [],
    };
  }
}
