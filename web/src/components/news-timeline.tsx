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

const sentimentColor = {
  positive: "text-red-600 dark:text-red-400",
  negative: "text-blue-600 dark:text-blue-400",
  neutral: "text-slate-500 dark:text-zinc-400",
};

export function NewsTimeline({ items }: { items: NewsItem[] }) {
  // Sort by time descending (latest first)
  const sorted = [...items].sort((a, b) => {
    const toMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    return toMin(b.time) - toMin(a.time);
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Daily News Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No news yet</p>
        ) : (
          <ul className="space-y-3">
            {sorted.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 w-12 shrink-0 pt-0.5 font-mono">
                  {item.time}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${sentimentColor[item.sentiment]}`}>
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
        )}
      </CardContent>
    </Card>
  );
}
