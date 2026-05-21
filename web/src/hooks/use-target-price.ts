"use client";

import { useEffect, useState, useCallback } from "react";

export interface AnalystSource {
  name: string;
  target: number;
  rating: string;
  url?: string;
}

export interface TargetPriceData {
  source: string;
  currentPrice: number;
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
  numberOfAnalysts: number;
  recommendation: string;
  recommendationMean: number;
  sources?: AnalystSource[];
}

export function useTargetPrice(symbol: string) {
  const [data, setData] = useState<TargetPriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchTarget = useCallback((forceRefresh = false) => {
    if (!symbol) return;
    setLoading(true);

    const refreshParam = forceRefresh ? "&refresh=1" : "";
    fetch(`/api/target-price?symbol=${encodeURIComponent(symbol)}${refreshParam}&_t=${Date.now()}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.error) {
          setData(res);
          setLastFetched(new Date());
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [symbol]);

  // Auto-fetch on mount + every hour
  useEffect(() => {
    fetchTarget();
    const interval = setInterval(fetchTarget, 60 * 60 * 1000); // 1 hour
    return () => clearInterval(interval);
  }, [fetchTarget]);

  return { data, loading, lastFetched, refresh: fetchTarget };
}
