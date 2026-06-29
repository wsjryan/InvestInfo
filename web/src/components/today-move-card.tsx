"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SourceLink } from "@/components/source-link";
import { useTZStore, formatInTZ } from "@/lib/timezone";
import type { PriceMove } from "@/hooks/use-price-move";

interface TodayMoveCardProps {
  data: PriceMove | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function marketStateLabel(s: string): string {
  switch (s) {
    case "REGULAR": return "장중";
    case "PRE":
    case "PREPRE": return "장전";
    case "POST":
    case "POSTPOST": return "시간외";
    case "CLOSED": return "장마감";
    default: return "";
  }
}

function formatPrice(value: number, currency: string): string {
  return currency === "KRW"
    ? value.toLocaleString("ko-KR")
    : value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function TodayMoveCard({ data, loading, error, onRetry }: TodayMoveCardProps) {
  const tz = useTZStore((s) => s.tz);

  if (loading && !data) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-zinc-500">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
            오늘의 등락 이유 분석 중...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error with no data to show — keep the block, offer a retry (don't vanish).
  if (!data && error) {
    const is429 = error.includes("429");
    return (
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm text-slate-500 dark:text-zinc-400">
              📊 오늘의 등락 — {is429 ? "요청이 많아 잠시 후 다시 시도하세요" : "분석을 불러오지 못했습니다"}
            </span>
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry} disabled={loading} className="h-7 text-[10px] px-3">
                {loading ? "재시도 중..." : "다시 시도"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const up = data.direction === "up" || (data.direction !== "down" && data.changePercent > 0);
  const down = data.direction === "down" || (data.direction !== "up" && data.changePercent < 0);
  // Korean market convention: 상승=빨강, 하락=파랑 (matches the News timeline)
  const moveColor = up
    ? "text-red-600 dark:text-red-400"
    : down
    ? "text-blue-600 dark:text-blue-400"
    : "text-slate-500 dark:text-zinc-400";
  const dotColor = up ? "bg-red-400" : down ? "bg-blue-400" : "bg-slate-300 dark:bg-zinc-600";
  const borderColor = up
    ? "border-l-red-400 dark:border-l-red-500"
    : down
    ? "border-l-blue-400 dark:border-l-blue-500"
    : "border-l-slate-200 dark:border-l-zinc-700";
  const arrow = up ? "▲" : down ? "▼" : "—";

  const sign = data.changePercent > 0 ? "+" : "";
  const mstate = marketStateLabel(data.marketState);
  const asOfLabel = data.asOf
    ? new Date(data.asOf).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }) + " KST"
    : "";

  return (
    <Card>
      <CardContent className="py-3 space-y-2">
        {/* Header: title + today's change */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">📊 오늘의 등락</span>
            {mstate && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                {mstate}
              </span>
            )}
          </div>
          <div className={`flex items-center gap-1.5 text-sm font-semibold ${moveColor}`}>
            <span>{arrow}</span>
            <span>{sign}{data.changePercent}%</span>
            {data.price > 0 && (
              <span className="text-xs font-normal text-slate-400 dark:text-zinc-500">
                {data.currency === "KRW" ? "₩" : "$"}{formatPrice(data.price, data.currency)}
              </span>
            )}
          </div>
        </div>

        {/* AI reasoning failed (e.g. 429) — show price above, offer retry here */}
        {data.reasonUnavailable && (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs text-slate-400 dark:text-zinc-500">
              AI 등락 이유 분석 일시 보류 {error?.includes("429") ? "(요청 한도)" : ""}
            </span>
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry} disabled={loading} className="h-7 text-[10px] px-3">
                {loading ? "재시도 중..." : "다시 시도"}
              </Button>
            )}
          </div>
        )}

        {/* Headline */}
        {data.headline && (
          <p className={`text-sm font-semibold ${moveColor}`}>{data.headline}</p>
        )}

        {/* Summary */}
        {data.summary && (
          <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">{data.summary}</p>
        )}

        {/* Drivers — rendered like the News timeline rows */}
        {data.drivers?.length > 0 && (
          <div className="pt-1">
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mb-1">근거 뉴스</p>
            <ul className="space-y-2">
              {data.drivers.map((d, i) => (
                <li key={i} className={`pl-3 py-2 rounded-r-md border-l-2 ${borderColor}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                      {d.time && (
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono w-28 text-center">
                          {formatInTZ(d.time, tz)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-zinc-300 leading-snug">
                        {d.url ? (
                          <a href={d.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {d.title}
                          </a>
                        ) : (
                          d.title
                        )}
                      </p>
                      {d.source && (
                        <div className="flex items-center gap-2 mt-1">
                          <SourceLink name={d.source} url={d.url} />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* As-of timestamp */}
        {asOfLabel && (
          <p className="text-[10px] text-slate-300 dark:text-zinc-600 pt-1">
            {asOfLabel} 기준{data.stale ? " · 캐시" : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
