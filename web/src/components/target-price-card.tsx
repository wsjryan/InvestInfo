"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SourceLink } from "@/components/source-link";

export interface AnalystEstimate {
  source: string;
  sourceUrl?: string;
  target: number;
  rating: "buy" | "hold" | "sell" | "outperform" | "underperform";
  date: string; // e.g. "2026-05-15 09:00"
}

interface TargetPriceCardProps {
  currentPrice: number;
  currency: string;
  estimates: AnalystEstimate[];
  macroScore: number;
  industryScore: number;
  stockScore: number;
}

const BULL_RATINGS = ["buy", "outperform"];
const BEAR_RATINGS = ["sell", "underperform"];

function scoreLabel(score: number): { text: string; color: string } {
  if (score > 0.3) return { text: "Bullish", color: "text-red-500" };
  if (score < -0.3) return { text: "Bearish", color: "text-blue-500" };
  return { text: "Neutral", color: "text-slate-400 dark:text-zinc-500" };
}

function formatPrice(price: number, currency: string) {
  return currency === "KRW"
    ? `₩${Math.round(price).toLocaleString("ko-KR")}`
    : `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function avgOf(arr: AnalystEstimate[]) {
  if (arr.length === 0) return 0;
  return arr.reduce((s, e) => s + e.target, 0) / arr.length;
}

function ratingColor(rating: string) {
  if (BULL_RATINGS.includes(rating)) return "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400";
  if (BEAR_RATINGS.includes(rating)) return "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400";
  return "bg-slate-50 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400";
}

export function TargetPriceCard({
  currentPrice,
  currency,
  estimates,
  macroScore,
  industryScore,
  stockScore,
}: TargetPriceCardProps) {
  const bullEstimates = estimates.filter((e) => BULL_RATINGS.includes(e.rating));
  const bearEstimates = estimates.filter((e) => BEAR_RATINGS.includes(e.rating));
  const neutralEstimates = estimates.filter((e) => !BULL_RATINGS.includes(e.rating) && !BEAR_RATINGS.includes(e.rating));

  const bullAvg = avgOf(bullEstimates);
  const bearAvg = avgOf(bearEstimates);
  const overallAvg = avgOf(estimates);

  const upside = currentPrice > 0 && overallAvg > 0
    ? ((overallAvg - currentPrice) / currentPrice * 100).toFixed(1)
    : "0";
  const isUpside = Number(upside) >= 0;

  const macro = scoreLabel(macroScore);
  const industry = scoreLabel(industryScore);
  const stock = scoreLabel(stockScore);

  return (
    <Card className="overflow-hidden">
      <CardContent className="py-4">
        {/* Formula: Macro × Industry × Stock = Price */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 flex-wrap">
          <div className="text-center">
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">Macro</div>
            <div className={`text-sm font-bold ${macro.color}`}>{macro.text}</div>
          </div>
          <span className="text-slate-300 dark:text-zinc-600 text-lg font-light">×</span>
          <div className="text-center">
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">Industry</div>
            <div className={`text-sm font-bold ${industry.color}`}>{industry.text}</div>
          </div>
          <span className="text-slate-300 dark:text-zinc-600 text-lg font-light">×</span>
          <div className="text-center">
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">Stock</div>
            <div className={`text-sm font-bold ${stock.color}`}>{stock.text}</div>
          </div>
          <span className="text-slate-300 dark:text-zinc-600 text-lg font-light">=</span>
          <div className="text-center">
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">Consensus Target</div>
            <div className={`text-lg font-bold ${isUpside ? "text-red-500" : "text-blue-500"}`}>
              {overallAvg > 0 ? formatPrice(overallAvg, currency) : "—"}
            </div>
          </div>
        </div>

        {/* Buy vs Sell target split */}
        {(bullEstimates.length > 0 || bearEstimates.length > 0) && (
          <div className="flex justify-center gap-6 mb-4">
            {bullEstimates.length > 0 && (
              <div className="text-center">
                <div className="text-[10px] text-red-400 mb-0.5">Buy/Outperform ({bullEstimates.length})</div>
                <div className="text-sm font-bold text-red-500">{formatPrice(bullAvg, currency)}</div>
              </div>
            )}
            {neutralEstimates.length > 0 && (
              <div className="text-center">
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">Hold ({neutralEstimates.length})</div>
                <div className="text-sm font-bold text-slate-500">{formatPrice(avgOf(neutralEstimates), currency)}</div>
              </div>
            )}
            {bearEstimates.length > 0 && (
              <div className="text-center">
                <div className="text-[10px] text-blue-400 mb-0.5">Sell/Underperform ({bearEstimates.length})</div>
                <div className="text-sm font-bold text-blue-500">{formatPrice(bearAvg, currency)}</div>
              </div>
            )}
          </div>
        )}

        {/* Upside/Downside bar */}
        {overallAvg > 0 && currentPrice > 0 && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 mb-1">
                <span>Current {formatPrice(currentPrice, currency)}</span>
                <span>Target {formatPrice(overallAvg, currency)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                <div
                  className="absolute top-0 bottom-0 bg-slate-400 dark:bg-zinc-500 rounded-full"
                  style={{
                    width: "3px",
                    left: `${Math.min(Math.max((currentPrice / (Math.max(overallAvg, currentPrice) * 1.1)) * 100, 5), 95)}%`,
                  }}
                />
                <div
                  className={`h-full rounded-full ${isUpside ? "bg-red-400/40" : "bg-blue-400/40"}`}
                  style={{
                    width: `${Math.min(Math.max((overallAvg / (Math.max(overallAvg, currentPrice) * 1.1)) * 100, 5), 95)}%`,
                  }}
                />
              </div>
            </div>
            <span className={`text-sm font-bold shrink-0 ${isUpside ? "text-red-500" : "text-blue-500"}`}>
              {isUpside ? "▲" : "▼"} {Math.abs(Number(upside))}%
            </span>
          </div>
        )}

        {/* Analyst estimates — grouped by rating */}
        {estimates.length > 0 && (
          <div className="border-t border-slate-100 dark:border-zinc-800 pt-3">
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mb-2">
              Analyst Estimates ({estimates.length} sources)
            </div>
            <div className="space-y-1.5">
              {estimates
                .sort((a, b) => {
                  const order = (r: string) => BULL_RATINGS.includes(r) ? 0 : BEAR_RATINGS.includes(r) ? 2 : 1;
                  return order(a.rating) - order(b.rating) || b.target - a.target;
                })
                .map((est, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <SourceLink name={est.source} url={est.sourceUrl} />
                    <span className="text-[10px] text-slate-300 dark:text-zinc-600">{est.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${ratingColor(est.rating)}`}>
                      {est.rating.toUpperCase()}
                    </span>
                    <span className="font-medium text-slate-700 dark:text-zinc-300 w-20 text-right">
                      {formatPrice(est.target, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
