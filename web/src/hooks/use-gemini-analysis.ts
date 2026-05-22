"use client";

import { useEffect, useState, useCallback } from "react";

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

export function useGeminiAnalysis(symbol: string) {
  const [data, setData] = useState<GeminiAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback((forceRefresh = false) => {
    if (!symbol) return;
    setLoading(true);
    setError(null);

    const refreshParam = forceRefresh ? "&refresh=1" : "";
    fetch(`/api/analysis?symbol=${encodeURIComponent(symbol)}${refreshParam}&_t=${Date.now()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) {
          setError(res.error);
        } else {
          setData(res);
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [symbol]);

  // Auto-fetch on mount + every hour
  useEffect(() => {
    fetchAnalysis();
    const interval = setInterval(() => fetchAnalysis(), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAnalysis]);

  return { data, loading, error, refresh: fetchAnalysis };
}
