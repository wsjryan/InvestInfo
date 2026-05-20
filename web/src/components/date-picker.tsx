"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
      >
        <span className="text-slate-400 dark:text-zinc-500 text-xs">📅</span>
        <span>{formatDate(value)}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            if (date) {
              onChange(date);
              setOpen(false);
            }
          }}
          disabled={{ after: new Date() }}
        />
        <div className="flex justify-end gap-1 px-3 pb-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              onChange(new Date());
              setOpen(false);
            }}
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
