import { getSupabase } from "@/lib/supabase";
import type { Report, UpcomingEvent, Period } from "@/lib/types";

/**
 * Fetch a report from Supabase for a specific ticker/period/date.
 * Returns null if no report exists (will fall back to mock data).
 */
export async function fetchReport(
  ticker: string,
  period: Period,
  date: string // YYYY-MM-DD
): Promise<Report | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("reports")
    .select("*")
    .eq("ticker", ticker)
    .eq("period_type", period)
    .eq("period_date", date)
    .single();

  if (error || !data) return null;

  // Transform DB row to Report type
  const macroFactors = (data.macro_factors as any[]) ?? [];
  const industryFactors = (data.industry_factors as any[]) ?? [];
  const stockFactors = (data.stock_factors as any[]) ?? [];

  return {
    ticker: data.ticker,
    period: data.period_type as Period,
    date: data.period_date,
    verdict: {
      verdict: data.verdict,
      confidence: data.verdict_confidence,
      summary: data.verdict_summary ?? "",
    },
    aiSummary: {
      sentiment: data.ai_sentiment,
      summary: data.ai_summary ?? "",
    },
    macro: {
      positive: macroFactors.filter((f: any) => f.sentiment === "positive"),
      negative: macroFactors.filter((f: any) => f.sentiment === "negative"),
    },
    industry: {
      positive: industryFactors.filter((f: any) => f.sentiment === "positive"),
      negative: industryFactors.filter((f: any) => f.sentiment === "negative"),
    },
    stock: {
      positive: stockFactors.filter((f: any) => f.sentiment === "positive"),
      negative: stockFactors.filter((f: any) => f.sentiment === "negative"),
    },
    news: [],
    events: [],
    updatedAt: data.created_at,
  };
}

/**
 * Fetch upcoming events from Supabase within a date range.
 */
export async function fetchUpcomingEvents(
  ticker?: string,
  daysAhead = 30
): Promise<UpcomingEvent[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const pastDate = new Date(today);
  pastDate.setDate(pastDate.getDate() - 7); // include recent past events

  let query = sb
    .from("events")
    .select("*")
    .gte("event_date", pastDate.toISOString().split("T")[0])
    .lte("event_date", futureDate.toISOString().split("T")[0])
    .order("event_date", { ascending: true });

  if (ticker) {
    query = query.or(`related_ticker.eq.${ticker},related_ticker.is.null`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row: any) => {
    const eventDate = new Date(row.event_date);
    const diffTime = eventDate.getTime() - today.getTime();
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      date: eventDate.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }),
      title: row.title,
      type: row.event_type,
      impact: row.impact,
      axis: row.axis,
      description: row.description ?? undefined,
      daysUntil,
    };
  });
}

/**
 * Save/update user's watchlist in Supabase.
 */
export async function saveWatchlistItem(ticker: string, name: string, market: string) {
  const sb = getSupabase();
  if (!sb) return;

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;

  await sb.from("watchlist").upsert(
    { user_id: user.id, ticker, name, market },
    { onConflict: "user_id,ticker" }
  );
}

export async function removeWatchlistItem(ticker: string) {
  const sb = getSupabase();
  if (!sb) return;

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;

  await sb.from("watchlist").delete().eq("user_id", user.id).eq("ticker", ticker);
}

export async function loadWatchlist(): Promise<{ ticker: string; name: string; market: string }[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];

  const { data, error } = await sb
    .from("watchlist")
    .select("ticker, name, market")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data;
}
