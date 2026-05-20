import type { EconomicIndicator } from "@/lib/types";

const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

/**
 * Fetch a FRED series (e.g., CPI, unemployment rate).
 * Requires FRED_API_KEY env var.
 */
export async function fetchFREDSeries(
  seriesId: string,
  name: string,
  unit: string
): Promise<EconomicIndicator | null> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `${FRED_BASE}?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    const obs = json.observations;
    if (!obs || obs.length < 1) return null;

    const latest = obs[0];
    const previous = obs[1] ?? obs[0];

    return {
      name,
      value: parseFloat(latest.value),
      previousValue: parseFloat(previous.value),
      unit,
      source: "FRED",
      sourceUrl: `https://fred.stlouisfed.org/series/${seriesId}`,
      recordedAt: latest.date,
    };
  } catch {
    return null;
  }
}

/** Common FRED series for macro dashboard */
export const FRED_SERIES = [
  { id: "CPIAUCSL", name: "CPI (US)", unit: "Index" },
  { id: "UNRATE", name: "Unemployment Rate (US)", unit: "%" },
  { id: "FEDFUNDS", name: "Fed Funds Rate", unit: "%" },
  { id: "DTWEXBGS", name: "USD Index (Trade Weighted)", unit: "Index" },
  { id: "T10Y2Y", name: "10Y-2Y Treasury Spread", unit: "%" },
  { id: "VIXCLS", name: "VIX", unit: "Index" },
] as const;

export async function fetchAllIndicators(): Promise<EconomicIndicator[]> {
  const results = await Promise.all(
    FRED_SERIES.map((s) => fetchFREDSeries(s.id, s.name, s.unit))
  );
  return results.filter((r): r is EconomicIndicator => r !== null);
}
