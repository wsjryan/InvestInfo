"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SourceLink } from "@/components/source-link";
import type { TargetPriceData, AnalystSource } from "@/hooks/use-target-price";

interface TargetPriceCardProps {
  currentPrice: number;
  currency: string;
  liveTarget: TargetPriceData | null;
  liveTargetLoading: boolean;
  lastFetched: Date | null;
  onRefresh: (forceRefresh?: boolean) => void;
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

function ratingColor(rating: string) {
  if (["buy", "outperform", "overweight"].includes(rating.toLowerCase())) return "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400";
  if (["sell", "underperform", "underweight"].includes(rating.toLowerCase())) return "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400";
  return "bg-slate-50 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400";
}

export function TargetPriceCard({
  currentPrice,
  currency,
  liveTarget,
  liveTargetLoading,
  lastFetched,
  onRefresh,
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
  const sources = liveTarget?.sources ?? [];
  const reasoning = liveTarget?.reasoning ?? "";
  const dataSource = liveTarget?.source ?? "";
  const queryTime = liveTarget?.queryTime ?? "";

  const upside = currentPrice > 0 && targetMean > 0
    ? ((targetMean - currentPrice) / currentPrice * 100).toFixed(1)
    : "0";
  const isUpside = Number(upside) >= 0;
  const rec = recLabel(recommendation);

  return (
    <Card className="overflow-hidden">
      <CardContent className="py-4">
        {/* Formula + live target — single row */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 flex-wrap">
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
            <span className="text-xs text-slate-400 animate-pulse">Analyzing...</span>
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
              <span className="text-slate-200 dark:text-zinc-700 mx-0.5">|</span>
              <div className="text-center">
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">Consensus</div>
                <div className={`text-sm font-bold ${rec.color}`}>
                  {rec.text} ({recMean.toFixed(1)})
                </div>
              </div>
              <span className="text-slate-200 dark:text-zinc-700 mx-0.5">|</span>
              <div className="text-center">
                <div className="text-[10px] text-red-300 dark:text-red-800 mb-0.5">High</div>
                <div className="text-sm font-bold text-red-400">{formatPrice(targetHigh, currency)}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-blue-300 dark:text-blue-800 mb-0.5">Low</div>
                <div className="text-sm font-bold text-blue-400">{formatPrice(targetLow, currency)}</div>
              </div>
            </>
          ) : (
            <span className="text-xs text-slate-400 dark:text-zinc-500">No analyst data</span>
          )}

          {/* Refresh button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRefresh(true)}
            disabled={liveTargetLoading}
            className="h-7 text-[10px] px-2 ml-1"
          >
            {liveTargetLoading ? "..." : "Refresh (Gemini)"}
          </Button>
        </div>

        {/* Upside/Downside bar */}
        {targetMean > 0 && currentPrice > 0 && (
          <div className="flex items-center gap-3 px-2 mb-3">
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

        {/* Reasoning — structured by axis */}
        {reasoning && (
          <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 mb-2 px-1">
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mb-2">Analysis Logic</div>
            <div className="space-y-2">
              {reasoning.split(/→\s*|\s*(?=\[(?:매크로|산업|종목|총평)\])/).filter(Boolean).map((section, i) => {
                const tagMatch = section.match(/^\[(.+?)\]\s*/);
                const tag = tagMatch?.[1] ?? "";
                const text = tagMatch ? section.slice(tagMatch[0].length) : section;
                if (!text.trim()) return null;
                const tagColor = tag === "매크로" ? "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                  : tag === "산업" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                  : tag === "종목" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400"
                  : tag === "총평" ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                  : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400";
                return (
                  <div key={i} className="flex items-start gap-2">
                    {tag && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 mt-0.5 font-medium ${tagColor}`}>
                        {tag}
                      </span>
                    )}
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">{text.trim()}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Analyst sources from Gemini */}
        {sources.length > 0 && (
          <div className="border-t border-slate-100 dark:border-zinc-800 pt-2 mb-2">
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mb-1.5">Analyst Estimates</div>
            <div className="space-y-1">
              {sources.map((s: AnalystSource, i: number) => (
                <div key={i} className="group">
                  <div className="flex items-center justify-between text-xs">
                    <SourceLink name={s.name} url={s.url} />
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${ratingColor(s.rating)}`}>
                        {s.rating.toUpperCase()}
                      </span>
                      <span className="font-medium text-slate-700 dark:text-zinc-300 w-20 text-right">
                        {formatPrice(s.target, currency)}
                      </span>
                    </div>
                  </div>
                  {s.reason && (
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 pl-1 leading-snug">
                      {s.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-[9px] text-slate-300 dark:text-zinc-600 space-y-0.5">
          <div className="flex items-center justify-between">
            <span>Source: {dataSource || "—"}</span>
            <span>
              {lastFetched
                ? `Updated: ${lastFetched.toLocaleString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })} · Auto 1h`
                : "Not loaded"}
            </span>
          </div>
          {queryTime && (
            <div>
              본 분석은 {new Date(queryTime).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })} KST 기준으로 Gemini AI에 요청한 결과입니다.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
