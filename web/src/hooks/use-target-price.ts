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

// Reads from the same analysis cache populated by useGeminiAnalysis prefetch
// This avoids double Gemini calls
import { getAnalysisCache } from "./use-gemini-analysis";

export function usePrefetchTargets(_tickers: string[]) {
  // No-op: targets are now included in analysis prefetch
}

export function useTargetPrice(symbol: string) {
  const [data, setData] = useState<TargetPriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getAnalysisCache(symbol);
    if (cached && cached.targetMean > 0) {
      setData({
        source: cached.source ?? "Gemini AI",
        queryTime: cached.queryTime,
        currentPrice: 0,
        targetHigh: cached.targetHigh ?? 0,
        targetLow: cached.targetLow ?? 0,
        targetMean: cached.targetMean ?? 0,
        targetMedian: cached.targetMean ?? 0,
        numberOfAnalysts: cached.numberOfAnalysts ?? 0,
        recommendation: cached.recommendation ?? "hold",
        recommendationMean: cached.recommendationMean ?? 3,
        reasoning: cached.reasoning,
        sources: cached.sources,
      });
      setLastFetched(new Date());
    } else {
      // No cache — try fetching directly
      setData(null);
      setLoading(true);
      fetch(`/api/analysis?symbol=${encodeURIComponent(symbol)}&_t=${Date.now()}`)
        .then((r) => r.json())
        .then((res) => {
          if (!res.error && res.targetMean > 0) {
            setData({
              source: res.source ?? "Gemini AI", queryTime: res.queryTime, currentPrice: 0,
              targetHigh: res.targetHigh ?? 0, targetLow: res.targetLow ?? 0,
              targetMean: res.targetMean ?? 0, targetMedian: res.targetMean ?? 0,
              numberOfAnalysts: res.numberOfAnalysts ?? 0,
              recommendation: res.recommendation ?? "hold",
              recommendationMean: res.recommendationMean ?? 3,
              reasoning: res.reasoning, sources: res.sources,
            });
            setLastFetched(new Date());
          } else if (res.error) {
            setError(res.error);
          }
          setLoading(false);
        })
        .catch((e) => { setError(e.message); setLoading(false); });
    }
  }, [symbol]);

  // Listen for analysis cache updates
  useEffect(() => {
    const interval = setInterval(() => {
      const cached = getAnalysisCache(symbol);
      if (cached && cached.targetMean > 0 && !data) {
        setData({
          source: cached.source ?? "Gemini AI",
          queryTime: cached.queryTime,
          currentPrice: 0,
          targetHigh: cached.targetHigh ?? 0,
          targetLow: cached.targetLow ?? 0,
          targetMean: cached.targetMean ?? 0,
          targetMedian: cached.targetMean ?? 0,
          numberOfAnalysts: cached.numberOfAnalysts ?? 0,
          recommendation: cached.recommendation ?? "hold",
          recommendationMean: cached.recommendationMean ?? 3,
          reasoning: cached.reasoning,
          sources: cached.sources,
        });
        setLastFetched(new Date());
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [symbol, data]);

  const refresh = useCallback((_forceRefresh = false) => {
    setLoading(true);
    setError(null);
    fetch(`/api/analysis?symbol=${encodeURIComponent(symbol)}&refresh=1&_t=${Date.now()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) {
          setError(res.error);
          setLoading(false);
          return;
        }
        if (res.targetMean > 0) {
          setData({
            source: res.source ?? "Gemini AI",
            queryTime: res.queryTime,
            currentPrice: 0,
            targetHigh: res.targetHigh ?? 0,
            targetLow: res.targetLow ?? 0,
            targetMean: res.targetMean ?? 0,
            targetMedian: res.targetMean ?? 0,
            numberOfAnalysts: res.numberOfAnalysts ?? 0,
            recommendation: res.recommendation ?? "hold",
            recommendationMean: res.recommendationMean ?? 3,
            reasoning: res.reasoning,
            sources: res.sources,
          });
          setLastFetched(new Date());
        }
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [symbol]);

  return { data, loading, lastFetched, error, refresh };
}
