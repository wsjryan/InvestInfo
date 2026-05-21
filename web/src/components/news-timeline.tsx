"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SourceLink } from "@/components/source-link";

export interface NewsItem {
  title: string;
  source: string;
  sourceUrl?: string;
  time: string;
  sentiment: "positive" | "negative" | "neutral";
  axis: "macro" | "industry" | "stock";
}

const axisLabel = { macro: "Macro", industry: "Industry", stock: "Stock" };

function parseTime(t: string): number {
  // "05/21 16:30" → sortable number
  const parts = t.replace(/\//g, "").replace(/ /g, "").replace(/:/g, "");
  return parseInt(parts, 10) || 0;
}

function sortByTime(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => parseTime(b.time) - parseTime(a.time));
}

function NewsList({ items, emptyText }: { items: NewsItem[]; emptyText: string }) {
  if (items.length === 0) {
    return <p className="text-xs text-slate-400 dark:text-zinc-500 italic py-2">{emptyText}</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <div className="text-[10px] text-slate-400 dark:text-zinc-500 w-24 shrink-0 pt-0.5 font-mono">
            {item.time}
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
                {axisLabel[item.axis]}
              </Badge>
              <SourceLink name={item.source} url={item.sourceUrl} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function NewsTimeline({ items }: { items: NewsItem[] }) {
  const positive = sortByTime(items.filter((n) => n.sentiment === "positive"));
  const negative = sortByTime(items.filter((n) => n.sentiment === "negative"));
  const neutral = sortByTime(items.filter((n) => n.sentiment === "neutral"));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Daily News Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Positive / Bullish */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 text-[10px]">
                Positive {positive.length}
              </Badge>
            </div>
            <NewsList items={positive} emptyText="No positive news" />
          </div>
          {/* Negative / Bearish */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-[10px]">
                Negative {negative.length}
              </Badge>
            </div>
            <NewsList items={negative} emptyText="No negative news" />
          </div>
        </div>
        {/* Neutral — below if any */}
        {neutral.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <Badge variant="outline" className="text-[10px] mb-2">Neutral {neutral.length}</Badge>
            <NewsList items={neutral} emptyText="" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
