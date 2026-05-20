"use client";

import { useEffect, useState } from "react";
import type { Quote } from "@/lib/types";

export function useQuotes(symbols: string[]) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/quotes?symbols=${symbols.join(",")}`)
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

    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetch(`/api/quotes?symbols=${symbols.join(",")}`)
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled) setQuotes(data);
        })
        .catch(() => {});
    }, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [symbols.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return { quotes, loading };
}
