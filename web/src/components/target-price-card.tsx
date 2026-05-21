"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SourceLink } from "@/components/source-link";

export interface AnalystEstimate {
  source: string;
  sourceUrl?: string;
  target: number;
  rating: "buy" | "hold" | "sell" | "outperform" | "underperform";
  date: string;
}

interface TargetPriceCardProps {
  currentPrice: number;
  currency: string;
  estimates: AnalystEstimate[];
  macroScore: number;  // -1 to 1
  industryScore: number;
  stockScore: number;
}

function scoreLabel(score: number): { text: string; color: string } {
  if (score > 0.3) return { text: "Bullish", color: "text-red-500" };
  if (score < -0.3) return { text: "Bearish", color: "text-blue-500" };
  return { text: "Neutral", color: "text-slate-400 dark:text-zinc-500" };
}

function formatPrice(price: number, currency: string) {
  return currency === "KRW"
    ? `₩${price.toLocaleString("ko-KR")}`
    : `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TargetPriceCard({
  currentPrice,
  currency,
  estimates,
  macroScore,
  industryScore,
  stockScore,
}: TargetPriceCardProps) {
  const avgTarget = estimates.length > 0
    ? estimates.reduce((sum, e) => sum + e.target, 0) / estimates.length
    : 0;
  const upside = currentPrice > 0 && avgTarget > 0
    ? ((avgTarget - currentPrice) / currentPrice * 100).toFixed(1)
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
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">Target</div>
            <div className={`text-lg font-bold ${isUpside ? "text-red-500" : "text-blue-500"}`}>
              {avgTarget > 0 ? formatPrice(Math.round(avgTarget), currency) : "—"}
            </div>
          </div>
        </div>

        {/* Upside/Downside bar */}
        {avgTarget > 0 && currentPrice > 0 && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 mb-1">
                <span>Current {formatPrice(currentPrice, currency)}</span>
                <span>Target {formatPrice(Math.round(avgTarget), currency)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                {/* Current position marker */}
                <div
                  className="absolute top-0 bottom-0 bg-slate-400 dark:bg-zinc-500 rounded-full"
                  style={{
                    width: "3px",
                    left: `${Math.min(Math.max((currentPrice / (Math.max(avgTarget, currentPrice) * 1.1)) * 100, 5), 95)}%`,
                  }}
                />
                {/* Target bar */}
                <div
                  className={`h-full rounded-full ${isUpside ? "bg-red-400/40" : "bg-blue-400/40"}`}
                  style={{
                    width: `${Math.min(Math.max((avgTarget / (Math.max(avgTarget, currentPrice) * 1.1)) * 100, 5), 95)}%`,
                  }}
                />
              </div>
            </div>
            <span className={`text-sm font-bold shrink-0 ${isUpside ? "text-red-500" : "text-blue-500"}`}>
              {isUpside ? "▲" : "▼"} {Math.abs(Number(upside))}%
            </span>
          </div>
        )}

        {/* Analyst estimates sources */}
        {estimates.length > 0 && (
          <div className="border-t border-slate-100 dark:border-zinc-800 pt-3">
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mb-2">
              Analyst Consensus ({estimates.length} sources)
            </div>
            <div className="space-y-1">
              {estimates.map((est, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <SourceLink name={est.source} url={est.sourceUrl} />
                    <span className="text-[10px] text-slate-300 dark:text-zinc-600">{est.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      est.rating === "buy" || est.rating === "outperform"
                        ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                        : est.rating === "sell" || est.rating === "underperform"
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                          : "bg-slate-50 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                      {est.rating.toUpperCase()}
                    </span>
                    <span className="font-medium text-slate-700 dark:text-zinc-300">
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
