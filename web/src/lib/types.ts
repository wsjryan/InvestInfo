// ─── Core domain types ───────────────────────────────────────

export type Axis = "macro" | "industry" | "stock";
export type Sentiment = "positive" | "negative" | "neutral";
export type Period = "hourly" | "daily" | "weekly" | "monthly";
export type Verdict = "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
export type EventType = "earnings" | "conference" | "economic" | "policy" | "product" | "ipo" | "dividend";
export type EventImpact = "high" | "medium" | "low";

// ─── Ticker / Watchlist ──────────────────────────────────────

export interface Ticker {
  symbol: string;
  name: string;
  market: string;
  sector?: string;
}

// ─── Factor (positive/negative item in axis card) ────────────

export interface Factor {
  text: string;
  source: string;
  sourceUrl?: string;
  axis: Axis;
  sentiment: Sentiment;
  publishedAt?: string;
}

// ─── News ────────────────────────────────────────────────────

export interface NewsArticle {
  title: string;
  source: string;
  sourceUrl?: string;
  time: string;
  sentiment: Sentiment;
  axis: Axis;
  summary?: string;
}

// ─── Upcoming Event ──────────────────────────────────────────

export interface UpcomingEvent {
  date: string;
  title: string;
  type: EventType;
  impact: EventImpact;
  axis: Axis;
  description?: string;
  daysUntil: number;
}

// ─── Report (AI generated per ticker/period/date) ────────────

export interface Report {
  ticker: string;
  period: Period;
  date: string;
  verdict: {
    verdict: Verdict;
    confidence: number;
    summary: string;
  };
  aiSummary: {
    sentiment: Sentiment;
    summary: string;
  };
  macro: { positive: Factor[]; negative: Factor[] };
  industry: { positive: Factor[]; negative: Factor[] };
  stock: { positive: Factor[]; negative: Factor[] };
  news: NewsArticle[];
  events: UpcomingEvent[];
  updatedAt: string;
}

// ─── Market Data (price quotes) ──────────────────────────────

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  currency: string;
}

// ─── Indicator (economic) ────────────────────────────────────

export interface EconomicIndicator {
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  source: string;
  sourceUrl?: string;
  recordedAt: string;
}
