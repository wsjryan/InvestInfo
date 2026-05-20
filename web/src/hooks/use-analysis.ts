"use client";

import { useEffect, useState, useCallback } from "react";

interface AnalysisData {
  ticker: string;
  name: string;
  verdict: { verdict: string; confidence: number; summary: string };
  aiSummary: { sentiment: string; summary: string };
  macro: { positive: any[]; negative: any[] };
  industry: { positive: any[]; negative: any[] };
  stock: { positive: any[]; negative: any[] };
  news: any[];
  quote?: { price: number; change: number; changePercent: number; currency: string };
  updatedAt: string;
}

export function useAnalysis(ticker: string) {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(() => {
    if (!ticker) return;

    setLoading(true);
    setError(null);

    fetch(`/api/analyze?ticker=${encodeURIComponent(ticker)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
      })
      .then((result) => {
        if (result.error) throw new Error(result.error);
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [ticker]);

  return { data, loading, error, refresh: fetchAnalysis };
}
