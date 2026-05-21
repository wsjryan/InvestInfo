"use client";

import { useEffect, useState } from "react";

export interface TargetPriceData {
  currentPrice: number;
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
  numberOfAnalysts: number;
  recommendation: string;
  recommendationMean: number;
}

export function useTargetPrice(symbol: string, refreshKey = 0) {
  const [data, setData] = useState<TargetPriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) { setLoading(false); return; }
    let cancelled = false;

    fetch(`/api/target-price?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled && !res.error) {
          setData(res);
        }
        if (!cancelled) setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [symbol, refreshKey]);

  return { data, loading };
}
