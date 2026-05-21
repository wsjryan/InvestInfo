"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockChartProps {
  symbol: string;
  range?: string;
  interval?: string;
}

const RANGE_OPTIONS = [
  { label: "1min", range: "1d", interval: "1m" },
  { label: "5min", range: "1d", interval: "5m" },
  { label: "15min", range: "5d", interval: "15m" },
  { label: "1H", range: "1mo", interval: "1h" },
  { label: "1D", range: "3mo", interval: "1d" },
  { label: "1D(1Y)", range: "1y", interval: "1d" },
  { label: "1W", range: "5y", interval: "1wk" },
  { label: "1M", range: "max", interval: "1mo" },
];

interface TooltipData {
  time: string;
  open: string;
  high: string;
  low: string;
  close: string;
  change: string;
  isUp: boolean;
}

export function StockChart({ symbol }: StockChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState(0); // default 1min
  const [currency, setCurrency] = useState("USD");
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);
  const [lastCandle, setLastCandle] = useState("");

  // Auto-refresh chart every 60s
  useEffect(() => {
    const interval = setInterval(() => setAutoRefreshCount((c) => c + 1), 15_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch chart data
  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    // Only show loading on first load, not refreshes
    if (candles.length === 0) setLoading(true);

    const opt = RANGE_OPTIONS[selectedRange];
    fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=${opt.range}&interval=${opt.interval}&_t=${Date.now()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.candles && data.candles.length > 0) {
          setCandles(data.candles);
          setCurrency(data.currency ?? "USD");
          const lastTs = data.candles[data.candles.length - 1].time;
          const d = new Date(lastTs * 1000);
          setLastCandle(`${String(d.getUTCMonth()+1).padStart(2,"0")}/${String(d.getUTCDate()).padStart(2,"0")} ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}:${String(d.getUTCSeconds()).padStart(2,"0")}`);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [symbol, selectedRange, autoRefreshCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Render chart
  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;

    let disposed = false;

    import("lightweight-charts").then((lc) => {
      if (disposed || !chartRef.current) return;

      // Clear previous chart
      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
      }

      const isDark = document.documentElement.classList.contains("dark");

      const chart = lc.createChart(chartRef.current, {
        width: chartRef.current.clientWidth,
        height: 240,
        layout: {
          background: { type: lc.ColorType.Solid, color: "transparent" },
          textColor: isDark ? "#a1a1aa" : "#64748b",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: isDark ? "#27272a" : "#f1f5f9" },
          horzLines: { color: isDark ? "#27272a" : "#f1f5f9" },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: isDark ? "#3f3f46" : "#e2e8f0",
        },
        rightPriceScale: {
          borderColor: isDark ? "#3f3f46" : "#e2e8f0",
          scaleMargins: { top: 0.1, bottom: 0.05 },
        },
        crosshair: {
          vertLine: { color: isDark ? "#52525b" : "#cbd5e1", style: 2, width: 1, labelBackgroundColor: isDark ? "#3f3f46" : "#e2e8f0" },
          horzLine: { color: isDark ? "#52525b" : "#cbd5e1", style: 2, width: 1, labelBackgroundColor: isDark ? "#3f3f46" : "#e2e8f0" },
        },
      });

      // v5 API: addSeries with CandlestickSeries type
      const CandlestickSeries = (lc as any).CandlestickSeries ?? (lc as any).CandlestickSeriesType;
      let candleSeries: any;
      if (CandlestickSeries) {
        candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#ef4444",
          downColor: "#3b82f6",
          borderUpColor: "#ef4444",
          borderDownColor: "#3b82f6",
          wickUpColor: "#ef4444",
          wickDownColor: "#3b82f6",
        });
      } else {
        // fallback for older versions
        candleSeries = (chart as any).addCandlestickSeries({
          upColor: "#ef4444",
          downColor: "#3b82f6",
          borderUpColor: "#ef4444",
          borderDownColor: "#3b82f6",
          wickUpColor: "#ef4444",
          wickDownColor: "#3b82f6",
        });
      }

      const formatted = candles.map((c) => ({
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      candleSeries.setData(formatted);
      chart.timeScale().fitContent();
      chartInstance.current = chart;

      // Crosshair tooltip
      const fmt = (v: number) =>
        currency === "KRW"
          ? `₩${v.toLocaleString("ko-KR")}`
          : `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      chart.subscribeCrosshairMove((param: any) => {
        if (!param.time || !param.seriesData) {
          setTooltip(null);
          return;
        }
        const d = param.seriesData.get(candleSeries);
        if (!d) { setTooltip(null); return; }

        // Use UTC to match X-axis (exchange local time)
        const ts = typeof param.time === "number"
          ? new Date(param.time * 1000)
          : new Date(`${(param.time as any).year}-${String((param.time as any).month).padStart(2,"0")}-${String((param.time as any).day).padStart(2,"0")}`);
        const timeStr = typeof param.time === "number"
          ? `${String(ts.getUTCMonth()+1).padStart(2,"0")}/${String(ts.getUTCDate()).padStart(2,"0")} ${String(ts.getUTCHours()).padStart(2,"0")}:${String(ts.getUTCMinutes()).padStart(2,"0")}`
          : ts.toLocaleDateString("ko-KR", { month:"2-digit", day:"2-digit" });
        const changeVal = d.close - d.open;
        const changePct = ((changeVal / d.open) * 100).toFixed(2);
        setTooltip({
          time: timeStr,
          open: fmt(d.open),
          high: fmt(d.high),
          low: fmt(d.low),
          close: fmt(d.close),
          change: `${changeVal >= 0 ? "+" : ""}${fmt(changeVal)} (${changeVal >= 0 ? "+" : ""}${changePct}%)`,
          isUp: changeVal >= 0,
        });
      });

      // Resize handler
      const resizeHandler = () => {
        if (chartRef.current && chart) {
          chart.applyOptions({ width: chartRef.current.clientWidth });
        }
      };
      window.addEventListener("resize", resizeHandler);

      return () => {
        window.removeEventListener("resize", resizeHandler);
      };
    });

    return () => {
      disposed = true;
      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
      }
    };
  }, [candles]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Price Chart
            <span className="ml-2 text-xs font-normal text-slate-400 dark:text-zinc-500">
              {symbol} ({currency})
            </span>
          </CardTitle>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map((opt, i) => (
              <button
                key={opt.label}
                onClick={() => setSelectedRange(i)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedRange === i
                    ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {loading ? (
          <div className="h-[240px] flex items-center justify-center">
            <span className="text-xs text-slate-400 dark:text-zinc-500 animate-pulse">Loading chart...</span>
          </div>
        ) : candles.length === 0 ? (
          <div className="h-[240px] flex items-center justify-center">
            <span className="text-xs text-slate-400 dark:text-zinc-500">No chart data available</span>
          </div>
        ) : (
          <div className="relative">
            <div ref={chartRef} className="w-full" />
            {tooltip && (
              <div className="absolute top-2 left-3 z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs pointer-events-none shadow-sm">
                <div className="font-medium text-slate-700 dark:text-zinc-300 mb-1">{tooltip.time}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-slate-500 dark:text-zinc-400">
                  <span>Open</span><span className="text-right">{tooltip.open}</span>
                  <span>High</span><span className="text-right">{tooltip.high}</span>
                  <span>Low</span><span className="text-right">{tooltip.low}</span>
                  <span>Close</span><span className="text-right font-medium text-slate-800 dark:text-zinc-200">{tooltip.close}</span>
                </div>
                <div className={`mt-1 pt-1 border-t border-slate-100 dark:border-zinc-800 font-medium ${tooltip.isUp ? "text-red-500" : "text-blue-500"}`}>
                  {tooltip.change}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-300 dark:text-zinc-600">
          <span>Source: Yahoo Finance</span>
          <span>Last candle: {lastCandle || "—"} · Auto 15s</span>
        </div>
      </CardContent>
    </Card>
  );
}
