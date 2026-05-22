"use client";

import { useEffect, useState, useCallback, useRef } from "react";

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

const targetCache: Record<string, { data: TargetPriceData; ts: number }> = {};
const CACHE_TTL = 60 * 60 * 1000;
const fetchingSet = new Set<string>();

async function fetchOneTarget(symbol: string, forceRefresh = false): Promise<TargetPriceData | null> {
  const cached = targetCache[symbol];
  if (!forceRefresh && cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }
  if (fetchingSet.has(symbol)) return cached?.data ?? null;

  fetchingSet.add(symbol);
  try {
    const refreshParam = forceRefresh ? "&refresh=1" : "";
    const res = await fetch(`/api/target-price?symbol=${encodeURIComponent(symbol)}${refreshParam}&_t=${Date.now()}`);
    const json = await res.json();
    if (!json.error) {
      targetCache[symbol] = { data: json, ts: Date.now() };
      return json;
    }
  } catch {} finally {
    fetchingSet.delete(symbol);
  }
  return cached?.data ?? null;
}

/** Prefetch targets for all watchlist tickers */
export function usePrefetchTargets(tickers: string[]) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current || tickers.length === 0) return;
    started.current = true;

    let i = 0;
    const next = () => {
      if (i >= tickers.length) return;
      const t = tickers[i++];
      if (!targetCache[t]) {
        fetchOneTarget(t).then(() => setTimeout(next, 3000));
      } else {
        setTimeout(next, 100);
      }
    };
    next();
  }, [tickers.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useTargetPrice(symbol: string) {
  const [data, setData] = useState<TargetPriceData | null>(() => targetCache[symbol]?.data ?? null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  useEffect(() => {
    const cached = targetCache[symbol];
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setData(cached.data);
      setLastFetched(new Date(cached.ts));
      setLoading(false);
      return;
    }
    setData(null);
    setLoading(true);
    fetchOneTarget(symbol).then((result) => {
      setData(result);
      if (result) setLastFetched(new Date());
      setLoading(false);
    });
  }, [symbol]);

  const refresh = useCallback((forceRefresh = false) => {
    setLoading(true);
    fetchOneTarget(symbol, forceRefresh).then((result) => {
      if (result) {
        setData(result);
        setLastFetched(new Date());
      }
      setLoading(false);
    });
  }, [symbol]);

  return { data, loading, lastFetched, refresh };
}
