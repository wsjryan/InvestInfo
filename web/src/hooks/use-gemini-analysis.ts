"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface GeminiAnalysis {
  queryTime: string;
  verdict: string;
  confidence: number;
  verdictSummary: string;
  aiSentiment: string;
  aiSummary: string;
  macro: { score: number; positive: any[]; negative: any[] };
  industry: { score: number; positive: any[]; negative: any[] };
  stock: { score: number; positive: any[]; negative: any[] };
  events: any[];
  stale?: boolean;
}

// Global client-side cache shared across all instances
const analysisCache: Record<string, { data: GeminiAnalysis; ts: number }> = {};
const CACHE_TTL = 60 * 60 * 1000; // 1hr
const fetchingSet = new Set<string>(); // prevent duplicate fetches

async function fetchOne(symbol: string, forceRefresh = false): Promise<GeminiAnalysis | null> {
  const cached = analysisCache[symbol];
  if (!forceRefresh && cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }
  if (fetchingSet.has(symbol)) return cached?.data ?? null; // already in flight

  fetchingSet.add(symbol);
  try {
    const refreshParam = forceRefresh ? "&refresh=1" : "";
    const res = await fetch(`/api/analysis?symbol=${encodeURIComponent(symbol)}${refreshParam}&_t=${Date.now()}`);
    const json = await res.json();
    if (!json.error) {
      analysisCache[symbol] = { data: json, ts: Date.now() };
      return json;
    }
  } catch {} finally {
    fetchingSet.delete(symbol);
  }
  return cached?.data ?? null;
}

/** Prefetch all watchlist tickers in background (staggered to avoid 429) */
export function usePrefetchAnalysis(tickers: string[]) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current || tickers.length === 0) return;
    started.current = true;

    // Stagger fetches: 1 per 3 seconds to avoid Gemini 429
    let i = 0;
    const next = () => {
      if (i >= tickers.length) return;
      const t = tickers[i++];
      if (!analysisCache[t]) {
        fetchOne(t).then(() => setTimeout(next, 3000));
      } else {
        setTimeout(next, 100); // already cached, skip quickly
      }
    };
    next();
  }, [tickers.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Use analysis for a single ticker (reads from cache) */
export function useGeminiAnalysis(symbol: string) {
  const [data, setData] = useState<GeminiAnalysis | null>(() => analysisCache[symbol]?.data ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On ticker change: show cache instantly, then refresh if needed
  useEffect(() => {
    const cached = analysisCache[symbol];
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setData(cached.data);
      setLoading(false);
      return;
    }
    // Not cached — fetch
    setData(null);
    setLoading(true);
    fetchOne(symbol).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [symbol]);

  const refresh = useCallback((forceRefresh = false) => {
    setLoading(true);
    setError(null);
    fetchOne(symbol, forceRefresh).then((result) => {
      if (result) setData(result);
      else setError("Failed to fetch");
      setLoading(false);
    });
  }, [symbol]);

  return { data, loading, error, refresh };
}
