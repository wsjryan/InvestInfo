"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SourceLink } from "@/components/source-link";

interface RawNewsItem {
  title: string;
  source: string;
  sourceUrl?: string;
  time: string;
}

// Ticker → search queries mapping
const TICKER_QUERIES: Record<string, string[]> = {
  "005930.KS": ["삼성전자"],
  "000660.KS": ["SK하이닉스"],
  GOOGL: ["Google Alphabet"],
  AAPL: ["Apple stock"],
  NVDA: ["NVIDIA"],
  MSFT: ["Microsoft"],
  TSLA: ["Tesla"],
  META: ["Meta Facebook"],
  AMZN: ["Amazon"],
  AVGO: ["Broadcom"],
  AMD: ["AMD stock"],
  MU: ["Micron stock"],
  INTC: ["Intel stock"],
  NFLX: ["Netflix stock"],
  "035420.KS": ["네이버"],
  "035720.KS": ["카카오"],
  "051910.KS": ["LG화학"],
  "006400.KS": ["삼성SDI"],
  "005380.KS": ["현대자동차"],
  "000270.KS": ["기아"],
  "068270.KS": ["셀트리온"],
  "207940.KS": ["삼성바이오로직스"],
  "003670.KS": ["포스코홀딩스"],
};

export function LiveNews({ ticker, tickerName }: { ticker: string; tickerName: string }) {
  const [news, setNews] = useState<RawNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    setLoading(true);

    const query = TICKER_QUERIES[ticker]?.[0] ?? tickerName;
    fetch(`/api/news?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          setNews(data.slice(0, 10));
        }
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [ticker, tickerName]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>Live News</span>
          <Badge variant="outline" className="text-[10px] font-normal">
            Google News
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 rounded bg-slate-100 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : news.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No news found</p>
        ) : (
          <ul className="space-y-3">
            {news.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 w-24 shrink-0 pt-0.5 font-mono">
                  {item.time}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-zinc-300 leading-snug">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <SourceLink name={item.source} url={item.sourceUrl} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
