"use client";

import { useEffect, useState } from "react";
import type { Quote } from "@/lib/types";

export function useQuotes(symbols: string[], refreshKey = 0) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);

  const key = symbols.join(",");

  useEffect(() => {
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    // Only show loading spinner on first load, not refreshes
    if (Object.keys(quotes).length === 0) setLoading(true);

    fetch(`/api/quotes?symbols=${key}&_t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setQuotes(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [key, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { quotes, loading };
}
