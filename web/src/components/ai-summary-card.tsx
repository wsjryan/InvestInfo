"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AISummaryCardProps {
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  ticker?: string;
  updatedAt?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

const sentimentConfig = {
  positive: { label: "Bullish", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  negative: { label: "Bearish", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  neutral: { label: "Neutral", className: "bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300" },
};

export function AISummaryCard({ summary, sentiment, ticker, updatedAt, onRefresh, loading }: AISummaryCardProps) {
  const config = sentimentConfig[sentiment];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            AI Summary
            {ticker && (
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">{ticker}</span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={config.className}>{config.label}</Badge>
            {updatedAt && (
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">{updatedAt}</span>
            )}
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading} className="h-6 text-[10px] px-2">
                {loading ? "..." : "Refresh (Gemini)"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">{summary}</p>
      </CardContent>
    </Card>
  );
}
