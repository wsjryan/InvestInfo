"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { TargetPriceData } from "@/hooks/use-target-price";

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
  liveTarget: TargetPriceData | null;
  liveTargetLoading: boolean;
  macroScore: number;
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
    ? `₩${Math.round(price).toLocaleString("ko-KR")}`
    : `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function recLabel(rec: string): { text: string; color: string } {
  if (rec === "buy" || rec === "strong_buy") return { text: "BUY", color: "text-red-500" };
  if (rec === "sell" || rec === "strong_sell") return { text: "SELL", color: "text-blue-500" };
  return { text: rec.toUpperCase(), color: "text-slate-400" };
}

export function TargetPriceCard({
  currentPrice,
  currency,
  liveTarget,
  liveTargetLoading,
  macroScore,
  industryScore,
  stockScore,
}: TargetPriceCardProps) {
  const macro = scoreLabel(macroScore);
  const industry = scoreLabel(industryScore);
  const stock = scoreLabel(stockScore);

  const targetMean = liveTarget?.targetMean ?? 0;
  const targetHigh = liveTarget?.targetHigh ?? 0;
  const targetLow = liveTarget?.targetLow ?? 0;
  const numAnalysts = liveTarget?.numberOfAnalysts ?? 0;
  const recommendation = liveTarget?.recommendation ?? "hold";
  const recMean = liveTarget?.recommendationMean ?? 3;

  const upside = currentPrice > 0 && targetMean > 0
    ? ((targetMean - currentPrice) / currentPrice * 100).toFixed(1)
    : "0";
  const isUpside = Number(upside) >= 0;

  const rec = recLabel(recommendation);

  return (
    <Card className="overflow-hidden">
      <CardContent className="py-4">
        {/* Formula + live target — single row */}
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

          {liveTargetLoading ? (
            <span className="text-xs text-slate-400 animate-pulse">Loading...</span>
          ) : targetMean > 0 ? (
            <>
              <div className="text-center">
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">
                  Target ({numAnalysts} analysts)
                </div>
                <div className={`text-lg font-bold ${isUpside ? "text-red-500" : "text-blue-500"}`}>
                  {formatPrice(targetMean, currency)}
                </div>
              </div>
              <span className="text-slate-200 dark:text-zinc-700 mx-1">|</span>
              <div className="text-center">
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">Consensus</div>
                <div className={`text-sm font-bold ${rec.color}`}>
                  {rec.text} ({recMean.toFixed(1)})
                </div>
              </div>
              <span className="text-slate-200 dark:text-zinc-700 mx-1">|</span>
              <div className="text-center">
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">High</div>
                <div className="text-sm font-bold text-red-400">{formatPrice(targetHigh, currency)}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">Low</div>
                <div className="text-sm font-bold text-blue-400">{formatPrice(targetLow, currency)}</div>
              </div>
            </>
          ) : (
            <span className="text-xs text-slate-400 dark:text-zinc-500">No analyst data</span>
          )}
        </div>

        {/* Upside/Downside bar */}
        {targetMean > 0 && currentPrice > 0 && (
          <div className="flex items-center gap-3 px-2">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 mb-1">
                <span>Current {formatPrice(currentPrice, currency)}</span>
                <span>Target {formatPrice(targetMean, currency)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                <div
                  className="absolute top-0 bottom-0 bg-slate-400 dark:bg-zinc-500 rounded-full"
                  style={{
                    width: "3px",
                    left: `${Math.min(Math.max((currentPrice / (Math.max(targetHigh, currentPrice) * 1.05)) * 100, 3), 97)}%`,
                  }}
                />
                <div
                  className={`h-full rounded-full ${isUpside ? "bg-red-400/40" : "bg-blue-400/40"}`}
                  style={{
                    width: `${Math.min(Math.max((targetMean / (Math.max(targetHigh, currentPrice) * 1.05)) * 100, 3), 97)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-300 dark:text-zinc-600 mt-0.5">
                <span>{formatPrice(targetLow, currency)}</span>
                <span>{formatPrice(targetHigh, currency)}</span>
              </div>
            </div>
            <span className={`text-sm font-bold shrink-0 ${isUpside ? "text-red-500" : "text-blue-500"}`}>
              {isUpside ? "▲" : "▼"} {Math.abs(Number(upside))}%
            </span>
          </div>
        )}

        <div className="text-[9px] text-slate-300 dark:text-zinc-600 text-right mt-1">
          Source: Yahoo Finance Analyst Estimates
        </div>
      </CardContent>
    </Card>
  );
}
