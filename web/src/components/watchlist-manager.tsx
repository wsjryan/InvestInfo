"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

export interface WatchlistItem {
  ticker: string;
  name: string;
  market: string;
}

interface WatchlistManagerProps {
  items: WatchlistItem[];
  selected: string;
  onSelect: (ticker: string) => void;
  onAdd: (item: WatchlistItem) => void;
  onRemove: (ticker: string) => void;
  onReorder: (items: WatchlistItem[]) => void;
}

const SUGGESTIONS: WatchlistItem[] = [
  // US Tech
  { ticker: "AAPL", name: "Apple", market: "NASDAQ" },
  { ticker: "MSFT", name: "Microsoft", market: "NASDAQ" },
  { ticker: "GOOGL", name: "Alphabet (Google)", market: "NASDAQ" },
  { ticker: "AMZN", name: "Amazon", market: "NASDAQ" },
  { ticker: "NVDA", name: "NVIDIA", market: "NASDAQ" },
  { ticker: "META", name: "Meta (Facebook)", market: "NASDAQ" },
  { ticker: "TSLA", name: "Tesla", market: "NASDAQ" },
  { ticker: "AVGO", name: "Broadcom", market: "NASDAQ" },
  { ticker: "AMD", name: "AMD", market: "NASDAQ" },
  { ticker: "MU", name: "Micron", market: "NASDAQ" },
  { ticker: "INTC", name: "Intel", market: "NASDAQ" },
  { ticker: "CRM", name: "Salesforce", market: "NYSE" },
  { ticker: "ORCL", name: "Oracle", market: "NYSE" },
  { ticker: "NFLX", name: "Netflix", market: "NASDAQ" },
  // US Others
  { ticker: "BRK-B", name: "Berkshire Hathaway", market: "NYSE" },
  { ticker: "JPM", name: "JPMorgan Chase", market: "NYSE" },
  { ticker: "V", name: "Visa", market: "NYSE" },
  { ticker: "UNH", name: "UnitedHealth", market: "NYSE" },
  { ticker: "JNJ", name: "Johnson & Johnson", market: "NYSE" },
  { ticker: "WMT", name: "Walmart", market: "NYSE" },
  { ticker: "XOM", name: "ExxonMobil", market: "NYSE" },
  { ticker: "LLY", name: "Eli Lilly", market: "NYSE" },
  { ticker: "COST", name: "Costco", market: "NASDAQ" },
  // Korea
  { ticker: "005930.KS", name: "Samsung Electronics", market: "KOSPI" },
  { ticker: "000660.KS", name: "SK Hynix", market: "KOSPI" },
  { ticker: "035420.KS", name: "Naver", market: "KOSPI" },
  { ticker: "035720.KS", name: "Kakao", market: "KOSPI" },
  { ticker: "051910.KS", name: "LG Chem", market: "KOSPI" },
  { ticker: "006400.KS", name: "Samsung SDI", market: "KOSPI" },
  { ticker: "005380.KS", name: "Hyundai Motor", market: "KOSPI" },
  { ticker: "000270.KS", name: "Kia", market: "KOSPI" },
  { ticker: "105560.KS", name: "KB Financial", market: "KOSPI" },
  { ticker: "055550.KS", name: "Shinhan Financial", market: "KOSPI" },
  { ticker: "068270.KS", name: "Celltrion", market: "KOSPI" },
  { ticker: "207940.KS", name: "Samsung Biologics", market: "KOSPI" },
  { ticker: "003670.KS", name: "POSCO Holdings", market: "KOSPI" },
  { ticker: "034730.KS", name: "SK Inc.", market: "KOSPI" },
  { ticker: "012330.KS", name: "Hyundai Mobis", market: "KOSPI" },
];

export function WatchlistManager({
  items,
  selected,
  onSelect,
  onAdd,
  onRemove,
  onReorder,
}: WatchlistManagerProps) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const dragItem = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const filteredSuggestions = SUGGESTIONS.filter(
    (s) =>
      !items.some((w) => w.ticker === s.ticker) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.ticker.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
    // Small drag ghost
    const ghost = document.createElement("div");
    ghost.textContent = items[index].name;
    ghost.style.cssText = "position:fixed;top:-100px;padding:4px 12px;border-radius:9999px;font-size:12px;background:#3b82f6;color:#fff;white-space:nowrap;";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, 14);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (index: number) => {
    if (dragItem.current === null || dragItem.current === index) {
      setDragOverIndex(null);
      return;
    }

    const reordered = [...items];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(index, 0, removed);
    onReorder(reordered);

    dragItem.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    setDragOverIndex(null);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {items.map((item, index) => {
        const isDragOver = dragOverIndex === index;
        const isDragging = dragItem.current === index;

        return (
          <div key={item.ticker} className="relative shrink-0 flex items-center">
            {/* Drop indicator — left side ghost */}
            {isDragOver && dragItem.current !== null && dragItem.current > index && (
              <div className="absolute -left-1.5 top-0 bottom-0 w-0.5 bg-blue-500 rounded-full z-10" />
            )}
            <button
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelect(item.ticker)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-grab active:cursor-grabbing ${
                isDragging ? "opacity-30 scale-95" : ""
              } ${
                isDragOver ? "ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-zinc-950" : ""
              } ${
                selected === item.ticker
                  ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              <span className="opacity-30 text-[10px]">⠿</span>
              {item.name}
              <span className="text-[10px] opacity-60">{item.market}</span>
            </button>
            {/* Drop indicator — right side ghost */}
            {isDragOver && dragItem.current !== null && dragItem.current < index && (
              <div className="absolute -right-1.5 top-0 bottom-0 w-0.5 bg-blue-500 rounded-full z-10" />
            )}
          </div>
        );
      })}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 cursor-pointer"
        >
          + Add
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Ticker</DialogTitle>
            <DialogDescription>Search and add stocks to your watchlist.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Search ticker or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3"
          />
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {filteredSuggestions.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-zinc-500 py-4 text-center">
                No results
              </p>
            )}
            {filteredSuggestions.map((s) => (
              <button
                key={s.ticker}
                onClick={() => {
                  onAdd(s);
                  setSearch("");
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <span>
                  {s.name}{" "}
                  <span className="text-xs text-slate-400 dark:text-zinc-500">{s.ticker}</span>
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {s.market}
                </Badge>
              </button>
            ))}
          </div>
          {items.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <p className="text-xs text-slate-400 dark:text-zinc-500 mb-2">Current watchlist</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item) => (
                  <Badge
                    key={item.ticker}
                    variant="outline"
                    className="gap-1 text-xs cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950 dark:hover:text-red-400"
                    onClick={() => onRemove(item.ticker)}
                  >
                    {item.name} ×
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <DialogClose className="mt-3">
            <Button variant="outline" size="sm" className="w-full">
              Done
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}
