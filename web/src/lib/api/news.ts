import type { NewsArticle, Axis, Sentiment } from "@/lib/types";

const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search";

interface RSSItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

/**
 * Fetch news from Google News RSS for a given query.
 * Returns raw articles — sentiment/axis classification is done separately by AI.
 */
export async function fetchNewsRSS(query: string, lang = "ko"): Promise<RSSItem[]> {
  const hl = lang === "ko" ? "ko" : "en";
  const gl = lang === "ko" ? "KR" : "US";
  const url = `${GOOGLE_NEWS_RSS}?q=${encodeURIComponent(query)}&hl=${hl}&gl=${gl}&ceid=${gl}:${hl}`;

  try {
    const res = await fetch(url, { cache: "no-store" }); // always fresh
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSSItems(xml);
  } catch {
    return [];
  }
}

function parseRSSItems(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const source = extractTag(block, "source");
    const pubDate = extractTag(block, "pubDate");
    if (title) {
      items.push({ title, link: link ?? "", source: source ?? "Unknown", pubDate: pubDate ?? "" });
    }
  }
  return items.slice(0, 30);
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const m = regex.exec(xml);
  return m ? (m[1] ?? m[2] ?? null) : null;
}

/**
 * Convert raw RSS items to NewsArticle format.
 * Sentiment & axis are placeholders — will be filled by AI classification.
 */
export function toNewsArticles(
  items: RSSItem[],
  defaultAxis: Axis = "stock",
  defaultSentiment: Sentiment = "neutral"
): NewsArticle[] {
  return items.map((item) => {
    const date = item.pubDate ? new Date(item.pubDate) : new Date();
    return {
      title: item.title,
      source: item.source,
      sourceUrl: item.link || undefined,
      time: date.toISOString(), // UTC ISO string — frontend converts to KST/EST
      sentiment: defaultSentiment,
      axis: defaultAxis,
    };
  });
}
