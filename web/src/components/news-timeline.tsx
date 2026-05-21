"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SourceLink } from "@/components/source-link";
import { useTZStore } from "@/lib/timezone";

export interface NewsItem {
  title: string;
  source: string;
  sourceUrl?: string;
  time: string;
  sentiment: "positive" | "negative" | "neutral";
  axis: "macro" | "industry" | "stock";
}

const axisLabel = { macro: "Macro", industry: "Industry", stock: "Stock" };

// Ticker → search queries
const TICKER_QUERIES: Record<string, string> = {
  "005930.KS": "삼성전자",
  "000660.KS": "SK하이닉스",
  GOOGL: "Google Alphabet",
  AAPL: "Apple stock",
  NVDA: "NVIDIA",
  MSFT: "Microsoft",
  TSLA: "Tesla",
  META: "Meta Facebook",
  AMZN: "Amazon",
  MU: "Micron stock",
  AMD: "AMD stock",
  AVGO: "Broadcom",
  NFLX: "Netflix stock",
  "035420.KS": "네이버",
  "035720.KS": "카카오",
};

function toMs(t: string): number {
  const d = new Date(t);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function sortByTime(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => toMs(b.time) - toMs(a.time));
}

function formatNewsTime(isoStr: string, tz: string): string {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleString("ko-KR", {
      timeZone: tz,
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return isoStr;
  }
}

function NewsList({ items, emptyText, tz }: { items: NewsItem[]; emptyText: string; tz: string }) {
  if (items.length === 0) {
    return <p className="text-xs text-slate-400 dark:text-zinc-500 italic py-2">{emptyText}</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <div className="text-[10px] text-slate-400 dark:text-zinc-500 w-28 shrink-0 pt-0.5 font-mono">
            {formatNewsTime(item.time, tz)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-snug text-slate-700 dark:text-zinc-300">
              {item.sourceUrl ? (
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {item.title}
                </a>
              ) : item.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] h-4">
                {axisLabel[item.axis] ?? item.axis}
              </Badge>
              <SourceLink name={item.source} url={item.sourceUrl} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

interface NewsTimelineProps {
  ticker: string;
  tickerName: string;
  mockItems: NewsItem[];
}

export function NewsTimeline({ ticker, tickerName, mockItems }: NewsTimelineProps) {
  const [liveNews, setLiveNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const tz = useTZStore((s) => s.tz);

  const fetchNews = useCallback(() => {
    const query = TICKER_QUERIES[ticker] ?? tickerName;
    setLoading(true);
    fetch(`/api/news?q=${encodeURIComponent(query)}&_t=${Date.now()}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLiveNews(data.map((n: any) => ({ ...n, sentiment: "neutral" as const, axis: "stock" as const })));
          setLastFetched(new Date());
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ticker, tickerName]);

  // Auto-fetch on mount + every hour
  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 10 * 60 * 1000); // every 10min
    return () => clearInterval(interval);
  }, [fetchNews]);

  // Merge mock + live, deduplicate by title
  const seen = new Set<string>();
  const allNews: NewsItem[] = [];
  for (const item of [...mockItems, ...liveNews]) {
    const key = item.title.slice(0, 30);
    if (!seen.has(key)) {
      seen.add(key);
      allNews.push(item);
    }
  }

  const positive = sortByTime(allNews.filter((n) => n.sentiment === "positive"));
  const negative = sortByTime(allNews.filter((n) => n.sentiment === "negative"));
  const neutral = sortByTime(allNews.filter((n) => n.sentiment === "neutral"));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">News Timeline</CardTitle>
          <div className="flex items-center gap-2">
            {lastFetched && (
              <span className="text-[10px] text-slate-300 dark:text-zinc-600">
                {lastFetched.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchNews}
              disabled={loading}
              className="h-6 text-[10px] px-2"
            >
              {loading ? "..." : "Refresh"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 text-[10px] mb-2">
              Positive {positive.length}
            </Badge>
            <NewsList items={positive} emptyText="No positive news" tz={tz} />
          </div>
          <div>
            <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-[10px] mb-2">
              Negative {negative.length}
            </Badge>
            <NewsList items={negative} emptyText="No negative news" tz={tz} />
          </div>
        </div>
        {neutral.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <Badge variant="outline" className="text-[10px] mb-2">Latest {neutral.length}</Badge>
            <NewsList items={neutral} emptyText="" tz={tz} />
          </div>
        )}
        <div className="text-[9px] text-slate-300 dark:text-zinc-600 text-right mt-2">
          Source: Google News · Auto 10min
        </div>
      </CardContent>
    </Card>
  );
}
