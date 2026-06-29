"use client";

import { useEffect, useState, useCallback } from "react";

export interface PriceMoveDriver {
  title: string;
  source?: string;
  time?: string; // ISO published time
  url?: string;
}

export interface PriceMove {
  symbol: string;
  asOf: string;
  price: number;
  prevClose: number;
  currency: string;
  changePercent: number;
  marketState: string;
  direction: "up" | "down" | "flat";
  headline: string;
  summary: string;
  drivers: PriceMoveDriver[];
  reasonUnavailable?: boolean; // price shown, but AI reasoning failed (e.g. 429)
  stale?: boolean;
}

// Global client-side cache shared across instances
const cache: Record<string, { data: PriceMove; ts: number }> = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 min
const fetchingSet = new Set<string>();

interface FetchResult {
  data: PriceMove | null;
  error: string | null;
}

async function fetchOne(symbol: string, force = false): Promise<FetchResult> {
  const cached = cache[symbol];
  if (!force && cached && Date.now() - cached.ts < CACHE_TTL) return { data: cached.data, error: null };
  if (fetchingSet.has(symbol)) return { data: cached?.data ?? null, error: null };

  fetchingSet.add(symbol);
  try {
    const refreshParam = force ? "&refresh=1" : "";
    const res = await fetch(`/api/price-move?symbol=${encodeURIComponent(symbol)}${refreshParam}&_t=${Date.now()}`);
    const json = await res.json();
    if (!json.error) {
      // Don't cache price-only partials — so reasoning is re-attempted next time.
      if (!json.reasonUnavailable) cache[symbol] = { data: json, ts: Date.now() };
      return { data: json, error: null };
    }
    // Keep any previous data visible; surface the error for a retry UI.
    return { data: cached?.data ?? null, error: json.error };
  } catch {
    return { data: cached?.data ?? null, error: "network" };
  } finally {
    fetchingSet.delete(symbol);
  }
}

/**
 * "Today's move reason" for a ticker. Same trigger as useGeminiAnalysis:
 * on ticker change, show a fresh cached value if present, otherwise auto-fetch.
 * The AI Analysis Refresh button additionally force-refreshes via refresh(true).
 */
export function usePriceMove(symbol: string) {
  const [data, setData] = useState<PriceMove | null>(() => cache[symbol]?.data ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cached = cache[symbol];
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setData(cached.data);
      setError(null);
      setLoading(false);
    } else {
      setData(null);
      setError(null);
      setLoading(true);
      fetchOne(symbol).then((r) => {
        if (!cancelled) {
          setData(r.data);
          setError(r.error);
          setLoading(false);
        }
      });
    }
    return () => { cancelled = true; };
  }, [symbol]);

  const refresh = useCallback(
    (force = false) => {
      const cur = symbol;
      setLoading(true);
      setError(null);
      fetchOne(cur, force).then((r) => {
        if (cur === symbol) {
          if (r.data) setData(r.data);
          setError(r.error);
          setLoading(false);
        }
      });
    },
    [symbol]
  );

  return { data, loading, error, refresh };
}
