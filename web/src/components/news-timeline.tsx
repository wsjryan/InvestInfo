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

const POSITIVE_KW = [
  "상승", "급등", "호재", "매수", "buy", "상향", "서프라이즈", "beat", "outperform",
  "increase", "raises", "upgrade", "surges", "rally", "bullish", "record", "성장",
  "확대", "개선", "회복", "강세", "돌파", "신고가", "수혜", "호실적", "target raised",
  "비중확대", "overweight", "재확인", "기대", "긍정", "upbeat", "gains", "soars",
];
const NEGATIVE_KW = [
  "하락", "급락", "악재", "매도", "sell", "하향", "miss", "underperform",
  "decrease", "downgrade", "plunges", "bearish", "위험", "리스크", "risk",
  "규제", "소송", "하락세", "과매도", "경고", "우려", "약세", "감소", "둔화",
  "target cut", "비중축소", "underweight", "압박", "부진", "적자", "손실",
];

function classifySentiment(title: string): "positive" | "negative" | "neutral" {
  const t = title.toLowerCase();
  let pos = 0, neg = 0;
  for (const kw of POSITIVE_KW) if (t.includes(kw.toLowerCase())) pos++;
  for (const kw of NEGATIVE_KW) if (t.includes(kw.toLowerCase())) neg++;
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

const TICKER_QUERIES: Record<string, string> = {
  "005930.KS": "삼성전자", "000660.KS": "SK하이닉스", GOOGL: "Google Alphabet",
  AAPL: "Apple stock", NVDA: "NVIDIA", MSFT: "Microsoft", TSLA: "Tesla",
  META: "Meta Facebook", AMZN: "Amazon", MU: "Micron stock", AMD: "AMD stock",
  AVGO: "Broadcom", TSM: "TSMC", NFLX: "Netflix stock",
  "035420.KS": "네이버", "035720.KS": "카카오",
};

type Tab = "all" | "positive" | "negative" | "neutral";

function toMs(t: string): number {
  const d = new Date(t);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function formatNewsTime(iso: string, tz: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("ko-KR", {
      timeZone: tz, month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
  } catch { return iso; }
}

const sentimentStyle = {
  positive: "border-l-2 border-l-red-400 dark:border-l-red-500",
  negative: "border-l-2 border-l-blue-400 dark:border-l-blue-500",
  neutral: "border-l-2 border-l-slate-200 dark:border-l-zinc-700",
};

const sentimentDot = {
  positive: "bg-red-400",
  negative: "bg-blue-400",
  neutral: "bg-slate-300 dark:bg-zinc-600",
};

interface NewsTimelineProps {
  ticker: string;
  tickerName: string;
  mockItems: NewsItem[];
}

export function NewsTimeline({ ticker, tickerName, mockItems }: NewsTimelineProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [sortMode, setSortMode] = useState<"latest" | "major">("latest");
  const tz = useTZStore((s) => s.tz);

  const fetchNews = useCallback(() => {
    const query = TICKER_QUERIES[ticker] ?? tickerName;
    setLoading(true);
    fetch(`/api/news?q=${encodeURIComponent(query)}&_t=${Date.now()}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const classified = data.map((n: any) => ({
            ...n,
            sentiment: classifySentiment(n.title),
            axis: "stock" as const,
          }));
          setNews(classified);
          setLastFetched(new Date());
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ticker, tickerName]);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 60 * 1000); // every 1min
    return () => clearInterval(interval);
  }, [fetchNews]);

  const MAJOR_SOURCES = [
    "reuters", "bloomberg", "wsj", "ft", "cnbc", "associated press", "nytimes",
    "연합뉴스", "한경", "매일경제", "조선비즈", "한국경제", "서울경제",
    "investing.com", "seeking alpha", "barron", "marketwatch",
  ];

  const allNews = [...news].sort((a, b) => {
    if (sortMode === "major") {
      const isMajor = (s: string) => MAJOR_SOURCES.some((m) => s.toLowerCase().includes(m)) ? 0 : 1;
      const w = isMajor(a.source) - isMajor(b.source);
      if (w !== 0) return w;
    }
    return toMs(b.time) - toMs(a.time);
  });

  const filtered = tab === "all" ? allNews : allNews.filter((n) => n.sentiment === tab);

  const counts = {
    all: allNews.length,
    positive: allNews.filter((n) => n.sentiment === "positive").length,
    negative: allNews.filter((n) => n.sentiment === "negative").length,
    neutral: allNews.filter((n) => n.sentiment === "neutral").length,
  };

  const tabs: { key: Tab; label: string; color: string }[] = [
    { key: "all", label: `전체 ${counts.all}`, color: "" },
    { key: "positive", label: `긍정 ${counts.positive}`, color: "text-red-500" },
    { key: "negative", label: `부정 ${counts.negative}`, color: "text-blue-500" },
    { key: "neutral", label: `중립 ${counts.neutral}`, color: "text-slate-400" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-semibold">News</CardTitle>
          <div className="flex items-center gap-2">
            {lastFetched && (
              <span className="text-[10px] text-slate-300 dark:text-zinc-600">
                {lastFetched.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={fetchNews} disabled={loading} className="h-6 text-[10px] px-2">
              {loading ? "..." : "Refresh"}
            </Button>
          </div>
        </div>
        {/* Tabs + Sort toggle */}
        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                  tab === t.key
                    ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : `bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 ${t.color || "text-slate-600 dark:text-zinc-400"}`
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0">
            {([["latest", "최신순"], ["major", "주요매체순"]] as const).map(([key, label], idx) => (
              <button
                key={key}
                onClick={() => setSortMode(key)}
                className={`px-2 py-0.5 text-[11px] border transition-colors cursor-pointer ${
                  sortMode === key
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                    : "bg-transparent text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-700 opacity-50 hover:opacity-100"
                } ${idx === 0 ? "rounded-l-md border-r-0" : "rounded-r-md"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && news.length === 0 ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded bg-slate-100 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-zinc-500 italic py-4 text-center">
            {tab === "all" ? "뉴스가 없습니다" : `${tab === "positive" ? "긍정" : tab === "negative" ? "부정" : "중립"} 뉴스가 없습니다`}
          </p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((item, i) => (
              <li key={i} className={`pl-3 py-2 rounded-r-md ${sentimentStyle[item.sentiment]}`}>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <div className={`w-2 h-2 rounded-full ${sentimentDot[item.sentiment]}`} />
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono w-28 text-center">
                      {formatNewsTime(item.time, tz)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-zinc-300 leading-snug">
                      {item.sourceUrl ? (
                        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {item.title}
                        </a>
                      ) : item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <SourceLink name={item.source} url={item.sourceUrl} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="text-[9px] text-slate-300 dark:text-zinc-600 text-right mt-2">
          Google News · Auto 1min
        </div>
      </CardContent>
    </Card>
  );
}
