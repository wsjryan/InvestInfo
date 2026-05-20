"use client";

import type { Quote } from "@/lib/types";

interface PriceTickerBarProps {
  quotes: Record<string, Quote>;
  watchlist: { ticker: string; name: string }[];
  selected: string;
  loading?: boolean;
}

export function PriceTickerBar({ quotes, watchlist, selected, loading }: PriceTickerBarProps) {
  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto py-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-32 rounded bg-slate-200 dark:bg-zinc-800 shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto py-2 -mx-1 px-1">
      {watchlist.map(({ ticker, name }) => {
        const q = quotes[ticker];
        if (!q || q.price === 0) return null;

        const isPositive = q.change >= 0;
        const isSelected = ticker === selected;
        const color = isPositive
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400";

        const formatted =
          q.currency === "KRW"
            ? `₩${q.price.toLocaleString("ko-KR")}`
            : `$${q.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        return (
          <div
            key={ticker}
            className={`shrink-0 flex flex-col px-3 py-1.5 rounded-lg border transition-colors ${
              isSelected
                ? "border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-800/50"
                : "border-transparent"
            }`}
          >
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate max-w-[100px]">
              {name}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                {formatted}
              </span>
              <span className={`text-[11px] font-medium ${color}`}>
                {isPositive ? "▲" : "▼"} {Math.abs(q.changePercent)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
