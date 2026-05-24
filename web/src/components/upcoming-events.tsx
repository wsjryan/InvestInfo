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

function EventItem({ event }: { event: UpcomingEvent }) {
  const dLabel = event.daysUntil === 0 ? "Today"
    : event.daysUntil < 0 ? `${Math.abs(event.daysUntil)}d ago`
    : `D-${event.daysUntil}`;

  return (
    <li className="text-sm flex items-start gap-1.5">
      <span className="text-slate-400 dark:text-zinc-500 text-[10px] font-mono w-12 shrink-0 pt-0.5">
        {event.date}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-slate-700 dark:text-zinc-300 leading-snug">
          {event.url ? (
            <a href={event.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-500 dark:text-blue-400">
              {event.title}
            </a>
          ) : event.title}
        </p>
        {event.description && (
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{event.description}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          <Badge variant="outline" className="text-[10px] h-4">{typeLabel[event.type]}</Badge>
          <Badge className={`text-[10px] h-4 ${impactColor[event.impact]}`}>{event.impact.toUpperCase()}</Badge>
          <span className="text-[10px] text-slate-300 dark:text-zinc-600">{dLabel}</span>
        </div>
      </div>
    </li>
  );
}

function AxisColumn({ icon, title, events }: { icon: string; title: string; events: UpcomingEvent[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <span>{icon}</span> {title}
          <span className="text-[10px] font-normal text-slate-400 dark:text-zinc-500">{events.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No events</p>
        ) : (
          <ul className="space-y-3">
            {events.map((e, i) => <EventItem key={i} event={e} />)}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function UpcomingEvents({ events }: { events: UpcomingEvent[] }) {
  const sorted = [...events].sort((a, b) => a.daysUntil - b.daysUntil);
  const macro = sorted.filter((e) => e.axis === "macro");
  const industry = sorted.filter((e) => e.axis === "industry");
  const stock = sorted.filter((e) => e.axis === "stock");

  if (sorted.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No upcoming events</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
        <span>Upcoming Events</span>
        <span className="text-[10px] font-normal text-slate-400 dark:text-zinc-500">~30 days</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AxisColumn icon="🌍" title="Macro" events={macro} />
        <AxisColumn icon="🏭" title="Industry" events={industry} />
        <AxisColumn icon="📈" title="Stock" events={stock} />
      </div>
    </div>
  );
}
