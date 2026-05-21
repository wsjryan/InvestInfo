"use client";

import { useEffect, useState } from "react";

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const date = now.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
      </span>
      <span className="text-[11px] text-green-500 dark:text-green-400 font-mono tabular-nums tracking-wider font-medium">
        LIVE
      </span>
      <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono tabular-nums tracking-wide">
        {date} {time}
      </span>
    </span>
  );
}
