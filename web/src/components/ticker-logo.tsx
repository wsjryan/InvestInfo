"use client";

import { useState } from "react";

interface TickerLogoProps {
  ticker: string;
  size?: number;
  className?: string;
}

export function TickerLogo({ ticker, size = 28, className = "" }: TickerLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    const letter = ticker.replace(/\d.*/g, "").charAt(0).toUpperCase();
    return (
      <div
        className={`shrink-0 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-zinc-400 ${className}`}
        style={{ width: size, height: size }}
      >
        {letter}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/logo?ticker=${encodeURIComponent(ticker)}`}
      alt={ticker}
      width={size}
      height={size}
      className={`shrink-0 rounded-full bg-white object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
