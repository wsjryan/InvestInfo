"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface UpcomingEvent {
  date: string;
  title: string;
  type: "earnings" | "conference" | "economic" | "policy" | "product" | "ipo" | "dividend";
  impact: "high" | "medium" | "low";
  axis: "macro" | "industry" | "stock";
  description?: string;
  url?: string;
  daysUntil: number;
}

const typeLabel: Record<UpcomingEvent["type"], string> = {
  earnings: "Earnings", conference: "Conference", economic: "Economic",
  policy: "Policy", product: "Product", ipo: "IPO", dividend: "Dividend",
};

const impactColor: Record<UpcomingEvent["impact"], string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  low: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const axisStyle = {
  macro: { label: "Macro", icon: "🌍", border: "border-l-amber-400 dark:border-l-amber-500" },
  industry: { label: "Industry", icon: "🏭", border: "border-l-indigo-400 dark:border-l-indigo-500" },
  stock: { label: "Stock", icon: "📈", border: "border-l-green-400 dark:border-l-green-500" },
};

function EventItem({ event }: { event: UpcomingEvent }) {
  const axis = axisStyle[event.axis];
  return (
    <li className={`pl-3 py-2 border-l-2 ${axis.border} rounded-r-md`}>
      <div className="flex items-start gap-3">
        <div className="text-[10px] text-slate-400 dark:text-zinc-500 w-14 shrink-0 pt-0.5 font-mono">
          <div>{event.date}</div>
          <div className="text-slate-300 dark:text-zinc-600">
            {event.daysUntil === 0 ? "Today"
              : event.daysUntil < 0 ? `${Math.abs(event.daysUntil)}d ago`
              : `D-${event.daysUntil}`}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700 dark:text-zinc-300 leading-snug">
            {event.url ? (
              <a href={event.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-500 dark:text-blue-400">
                {event.title}
              </a>
            ) : event.title}
          </p>
          {event.description && (
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{event.description}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <Badge variant="outline" className="text-[10px] h-4">{typeLabel[event.type]}</Badge>
            <Badge className={`text-[10px] h-4 ${impactColor[event.impact]}`}>{event.impact.toUpperCase()}</Badge>
          </div>
        </div>
      </div>
    </li>
  );
}

export function UpcomingEvents({ events }: { events: UpcomingEvent[] }) {
  const sorted = [...events].sort((a, b) => a.daysUntil - b.daysUntil);
  const macroEvents = sorted.filter((e) => e.axis === "macro");
  const industryEvents = sorted.filter((e) => e.axis === "industry");
  const stockEvents = sorted.filter((e) => e.axis === "stock");

  const sections = [
    { key: "macro", label: "Macro", icon: "🌍", items: macroEvents },
    { key: "industry", label: "Industry", icon: "🏭", items: industryEvents },
    { key: "stock", label: "Stock", icon: "📈", items: stockEvents },
  ].filter((s) => s.items.length > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>Upcoming Events</span>
          <span className="text-[10px] font-normal text-slate-400 dark:text-zinc-500">~30 days</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No upcoming events</p>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.key}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs">{section.icon}</span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">{section.label}</span>
                  <span className="text-[10px] text-slate-300 dark:text-zinc-600">{section.items.length}</span>
                </div>
                <ul className="space-y-2">
                  {section.items.map((event, i) => (
                    <EventItem key={i} event={event} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
