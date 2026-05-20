"use client";

import { Card, CardContent } from "@/components/ui/card";

export type Verdict = "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";

interface VerdictCardProps {
  verdict: Verdict;
  confidence: number;
  summary: string;
}

const verdictConfig: Record<Verdict, { label: string; emoji: string; color: string; bg: string }> = {
  strong_buy: {
    label: "Strong Buy",
    emoji: "🟢",
    color: "text-green-700 dark:text-green-300",
    bg: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
  },
  buy: {
    label: "Buy",
    emoji: "🟢",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800/50",
  },
  hold: {
    label: "Hold",
    emoji: "🟡",
    color: "text-yellow-700 dark:text-yellow-300",
    bg: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800",
  },
  sell: {
    label: "Sell",
    emoji: "🔴",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800/50",
  },
  strong_sell: {
    label: "Strong Sell",
    emoji: "🔴",
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
  },
};

export function VerdictCard({ verdict, confidence, summary }: VerdictCardProps) {
  const config = verdictConfig[verdict];
  const barWidth = Math.min(Math.max(confidence, 0), 100);

  return (
    <Card className={`border ${config.bg}`}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.emoji}</span>
            <span className={`text-lg font-bold ${config.color}`}>{config.label}</span>
          </div>
          <span className="text-xs text-slate-400 dark:text-zinc-500">
            Confidence {confidence}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-full mb-3">
          <div
            className={`h-full rounded-full transition-all ${
              verdict.includes("buy")
                ? "bg-green-500"
                : verdict.includes("sell")
                  ? "bg-red-500"
                  : "bg-yellow-500"
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{summary}</p>
      </CardContent>
    </Card>
  );
}
