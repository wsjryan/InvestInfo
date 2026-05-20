"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SourceLink } from "@/components/source-link";

export interface FactorItem {
  text: string;
  source?: string;
  sourceUrl?: string;
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
          <span className={type === "positive" ? "text-green-500" : "text-red-500"}>
            {type === "positive" ? "+" : "-"}
          </span>
          <span className="text-slate-700 dark:text-zinc-300 flex-1">{item.text}</span>
          {item.source && <SourceLink name={item.source} url={item.sourceUrl} />}
        </li>
      ))}
    </ul>
  );
}

export function AxisCard({ title, icon, positive, negative, collapsible = false }: AxisCardProps) {
  const content = (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 text-[10px]">
            Positive {positive.length}
          </Badge>
        </div>
        <FactorList items={positive} type="positive" />
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 text-[10px]">
            Negative {negative.length}
          </Badge>
        </div>
        <FactorList items={negative} type="negative" />
      </div>
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
