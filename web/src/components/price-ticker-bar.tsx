"use client";

import { useRef, useState } from "react";
import type { Quote } from "@/lib/types";

interface PriceTickerBarProps {
  quotes: Record<string, Quote>;
  watchlist: { ticker: string; name: string }[];
  selected: string;
  loading?: boolean;
  onSelect: (ticker: string) => void;
  onReorder: (fromTicker: string, toTicker: string) => void;
}

export function PriceTickerBar({ quotes, watchlist, selected, loading, onSelect, onReorder }: PriceTickerBarProps) {
  const dragItem = useRef<string | null>(null);
  const [dragOverTicker, setDragOverTicker] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, ticker: string, name: string) => {
    dragItem.current = ticker;
    e.dataTransfer.effectAllowed = "move";
    const ghost = document.createElement("div");
    ghost.textContent = name;
    ghost.style.cssText = "position:fixed;top:-100px;padding:4px 12px;border-radius:9999px;font-size:12px;background:#3b82f6;color:#fff;white-space:nowrap;";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, 14);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDrop = (toTicker: string) => {
    if (dragItem.current && dragItem.current !== toTicker) {
      onReorder(dragItem.current, toTicker);
    }
    dragItem.current = null;
    setDragOverTicker(null);
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto py-1 animate-pulse scrollbar-thin">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-32 rounded bg-slate-200 dark:bg-zinc-800 shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto py-1 -mx-1 px-1 scrollbar-thin">
      {watchlist.map(({ ticker, name }) => {
        const q = quotes[ticker];
        if (!q || q.price === 0) return null;

        const isPositive = q.change >= 0;
        const isSelected = ticker === selected;
        const isDragOver = dragOverTicker === ticker;
        const isDragging = dragItem.current === ticker;
        const color = isPositive
          ? "text-red-500 dark:text-red-400"
          : "text-blue-500 dark:text-blue-400";

        const formatted =
          q.currency === "KRW"
            ? `₩${q.price.toLocaleString("ko-KR")}`
            : `$${q.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        return (
          <button
            key={ticker}
            draggable
            onClick={() => onSelect(ticker)}
            onDragStart={(e) => handleDragStart(e, ticker, name)}
            onDragOver={(e) => { e.preventDefault(); setDragOverTicker(ticker); }}
            onDragLeave={() => setDragOverTicker(null)}
            onDrop={() => handleDrop(ticker)}
            onDragEnd={() => { dragItem.current = null; setDragOverTicker(null); }}
            className={`shrink-0 flex flex-col px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              isDragging ? "opacity-30" : ""
            } ${
              isDragOver ? "ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-zinc-950" : ""
            } ${
              isSelected
                ? "border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-800/50"
                : "border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/30"
            }`}
          >
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate max-w-[100px] text-left">
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
          </button>
        );
      })}
    </div>
  );
}
