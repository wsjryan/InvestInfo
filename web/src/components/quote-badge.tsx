"use client";

import type { Quote } from "@/lib/types";

interface QuoteBadgeProps {
  quote?: Quote;
  loading?: boolean;
}

export function QuoteBadge({ quote, loading }: QuoteBadgeProps) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500 animate-pulse">
        Loading...
      </span>
    );
  }

  if (!quote || quote.price === 0) return null;

  const isPositive = quote.change >= 0;
  const color = isPositive
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";

  const formatted = quote.currency === "KRW"
    ? quote.price.toLocaleString("ko-KR")
    : quote.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="font-semibold text-slate-800 dark:text-zinc-200">
        {quote.currency === "KRW" ? "₩" : "$"}{formatted}
      </span>
      <span className={`text-xs font-medium ${color}`}>
        {isPositive ? "+" : ""}{quote.change} ({isPositive ? "+" : ""}{quote.changePercent}%)
      </span>
    </span>
  );
}
