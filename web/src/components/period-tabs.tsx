"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type Period = "hourly" | "daily" | "weekly" | "monthly";

interface PeriodTabsProps {
  value: Period;
  onChange: (period: Period) => void;
}

const periods: { value: Period; label: string }[] = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function PeriodTabs({ value, onChange }: PeriodTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Period)}>
      <TabsList className="w-full sm:w-auto">
        {periods.map((p) => (
          <TabsTrigger key={p.value} value={p.value} className="flex-1 sm:flex-none text-xs">
            {p.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
