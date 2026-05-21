"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SourceLink } from "@/components/source-link";

export interface FactorItem {
  text: string;
  source?: string;
  sourceUrl?: string;
  date?: string; // e.g. "05/19", "2026-05-19"
}

interface AxisCardProps {
  title: string;
  icon: string;
  positive: FactorItem[];
  negative: FactorItem[];
  collapsible?: boolean;
}

function FactorList({ items, type }: { items: FactorItem[]; type: "positive" | "negative" }) {
  if (items.length === 0) {
    return <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No data</p>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-sm flex items-start gap-1.5">
          <span className={type === "positive" ? "text-red-500" : "text-blue-500"}>
            {type === "positive" ? "+" : "-"}
          </span>
          <span className="text-slate-700 dark:text-zinc-300 flex-1">{item.text}</span>
          {item.source && <SourceLink name={item.source} url={item.sourceUrl} />}
          {item.date && (
            <span className="text-[10px] text-slate-300 dark:text-zinc-600 shrink-0">
              {item.date}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

// Timeline view for "More" dialog
function FactorTimeline({ items }: { items: FactorItem[] }) {
  // Group by date
  const grouped = new Map<string, FactorItem[]>();
  items.forEach((item) => {
    const key = item.date ?? "Unknown";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  });

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto">
      {Array.from(grouped.entries()).map(([date, factors]) => (
        <div key={date}>
          <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1.5 sticky top-0 bg-white dark:bg-zinc-950 py-1">
            {date}
          </div>
          <ul className="space-y-1.5 pl-2 border-l-2 border-slate-100 dark:border-zinc-800">
            {factors.map((f, i) => (
              <li key={i} className="text-sm flex items-start gap-1.5 pl-2">
                <span className="text-slate-700 dark:text-zinc-300 flex-1">{f.text}</span>
                {f.source && <SourceLink name={f.source} url={f.sourceUrl} />}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function AxisCard({ title, icon, positive, negative, collapsible = false }: AxisCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const allFactors = [
    ...positive.map((f) => ({ ...f, _type: "positive" as const })),
    ...negative.map((f) => ({ ...f, _type: "negative" as const })),
  ];

  const content = (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 text-[10px]">
            Positive {positive.length}
          </Badge>
        </div>
        <FactorList items={positive} type="positive" />
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-[10px]">
            Negative {negative.length}
          </Badge>
        </div>
        <FactorList items={negative} type="negative" />
      </div>
      {/* More button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger className="w-full text-center text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 py-1 cursor-pointer">
          View timeline →
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{icon}</span> {title} Timeline
            </DialogTitle>
            <DialogDescription>Historical factors by date</DialogDescription>
          </DialogHeader>
          <FactorTimeline items={allFactors} />
          <DialogClose>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Close
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (collapsible) {
    return (
      <Accordion defaultValue={[0]}>
        <AccordionItem className="border-0">
          <Card>
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span>{icon}</span> {title}
                <Badge variant="outline" className="text-[10px] ml-1">
                  +{positive.length} / -{negative.length}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="pt-0 pb-4">{content}</CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <span>{icon}</span> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
