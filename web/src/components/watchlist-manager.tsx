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
  { ticker: "005930.KS", name: "Samsung Electronics", market: "KOSPI" },
  { ticker: "000660.KS", name: "SK Hynix", market: "KOSPI" },
  { ticker: "GOOGL", name: "Alphabet (Google)", market: "NASDAQ" },
  { ticker: "AAPL", name: "Apple", market: "NASDAQ" },
  { ticker: "NVDA", name: "NVIDIA", market: "NASDAQ" },
  { ticker: "MSFT", name: "Microsoft", market: "NASDAQ" },
  { ticker: "TSLA", name: "Tesla", market: "NASDAQ" },
  { ticker: "035420.KS", name: "Naver", market: "KOSPI" },
  { ticker: "035720.KS", name: "Kakao", market: "KOSPI" },
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
  const dragOverItem = useRef<number | null>(null);

  const filteredSuggestions = SUGGESTIONS.filter(
    (s) =>
      !items.some((w) => w.ticker === s.ticker) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.ticker.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
  };

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const reordered = [...items];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);
    onReorder(reordered);

    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {items.map((item, index) => (
        <button
          key={item.ticker}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={handleDrop}
          onClick={() => onSelect(item.ticker)}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-grab active:cursor-grabbing ${
            selected === item.ticker
              ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          <span className="opacity-40 text-[10px]">⠿</span>
          {item.name}
          <span className="text-[10px] opacity-60">{item.market}</span>
        </button>
      ))}

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
