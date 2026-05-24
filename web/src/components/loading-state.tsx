"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingStateProps {
  geminiLoading: boolean;
  quotesLoading: boolean;
  hasGeminiData: boolean;
}

export function LoadingBanner({ geminiLoading, quotesLoading, hasGeminiData }: LoadingStateProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!geminiLoading && !quotesLoading) return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [geminiLoading, quotesLoading]);

  if (!geminiLoading && !quotesLoading) return null;

  const steps = [
    { label: "주가 데이터", done: !quotesLoading },
    { label: "AI 분석 (Gemini)", done: hasGeminiData },
  ];

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <CardContent className="py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-5 w-5 shrink-0">
            <div className="absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-800" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              데이터 로딩 중{dots}
            </p>
            <div className="flex items-center gap-3 mt-1">
              {steps.map((step) => (
                <span key={step.label} className="flex items-center gap-1 text-[11px]">
                  <span className={step.done ? "text-green-500" : "text-blue-400 dark:text-blue-500"}>
                    {step.done ? "✓" : "○"}
                  </span>
                  <span className={step.done ? "text-slate-400 dark:text-zinc-500" : "text-blue-600 dark:text-blue-400"}>
                    {step.label}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-blue-400 dark:text-blue-600 shrink-0">
            최초 로딩 시 ~10초 소요
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/** Skeleton placeholder for sections that are loading */
export function SectionSkeleton({ label, height = "h-32" }: { label: string; height?: string }) {
  return (
    <Card>
      <CardContent className={`${height} flex items-center justify-center`}>
        <div className="text-center">
          <div className="relative h-5 w-5 mx-auto mb-2">
            <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-zinc-700" />
            <div className="absolute inset-0 rounded-full border-2 border-slate-400 dark:border-zinc-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-xs text-slate-400 dark:text-zinc-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
