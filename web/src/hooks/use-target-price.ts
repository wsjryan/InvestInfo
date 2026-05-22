"use client";

import { useEffect, useState, useCallback } from "react";

export interface AnalystSource {
  name: string;
  target: number;
  rating: string;
  reason?: string;
  url?: string;
}

export interface TargetPriceData {
  source: string;
  queryTime?: string;
  currentPrice: number;
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
  numberOfAnalysts: number;
  recommendation: string;
  recommendationMean: number;
  reasoning?: string;
  sources?: AnalystSource[];
}

export function useTargetPrice(symbol: string) {
  const [data, setData] = useState<TargetPriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Reset on ticker change
  useEffect(() => {
    setData(null);
  }, [symbol]);

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

  // Only fetch on mount (cached server-side), no auto-refresh to avoid 429
  useEffect(() => {
    fetchTarget();
  }, [fetchTarget]);

  return { data, loading, lastFetched, refresh: fetchTarget };
}
