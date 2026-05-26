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
const analysisCache: Record<string, { data: any; ts: number }> = {};

/** Read from cache (used by useTargetPrice) */
export function getAnalysisCache(symbol: string): any | null {
  const c = analysisCache[symbol];
  return c ? c.data : null;
}
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

/** Prefetch disabled — manual only to avoid Gemini 429 */
export function usePrefetchAnalysis(_tickers: string[]) {
  // No-op: user clicks Refresh manually
}

/** Use analysis for a single ticker (reads from cache) */
export function useGeminiAnalysis(symbol: string) {
  const [data, setData] = useState<GeminiAnalysis | null>(() => analysisCache[symbol]?.data ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On ticker change: show cache if available, fetch if no cache
  useEffect(() => {
    let cancelled = false;
    const cached = analysisCache[symbol];
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setData(cached.data);
      setLoading(false);
    } else {
      setData(null);
      setLoading(true);
      fetchOne(symbol).then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      });
    }
    return () => { cancelled = true; };
  }, [symbol]);

  const refresh = useCallback((forceRefresh = false) => {
    const currentSymbol = symbol;
    setLoading(true);
    setError(null);
    fetchOne(currentSymbol, forceRefresh).then((result) => {
      // Only update if still on same ticker
      if (currentSymbol === symbol) {
        if (result) setData(result);
        else setError("Failed to fetch");
        setLoading(false);
      }
    });
  }, [symbol]);

  return { data, loading, error, refresh };
}
