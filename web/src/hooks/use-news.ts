"use client";

import { useEffect, useState } from "react";
import type { NewsArticle } from "@/lib/types";

export function useNews(query: string) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/news?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setNews(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [query]);

  return { news, loading };
}
