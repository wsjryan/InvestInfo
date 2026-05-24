"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingStep {
  label: string;
  done: boolean;
  auto?: boolean; // true = auto-refresh, false = manual button
}

interface LoadingStateProps {
  steps: LoadingStep[];
}

export function LoadingBanner({ steps }: LoadingStateProps) {
  const [dots, setDots] = useState("");
  const autoSteps = steps.filter((s) => s.auto !== false);
  const manualSteps = steps.filter((s) => s.auto === false);
  const allAutoDone = autoSteps.every((s) => s.done);
  const allDone = steps.every((s) => s.done);
  const allManualDone = manualSteps.every((s) => s.done);
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    if (allDone) {
      setShowComplete(true);
      const timer = setTimeout(() => setShowComplete(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [allDone]);

  useEffect(() => {
    if (allAutoDone) return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [allAutoDone]);

  // Hide completely after done animation
  if (allDone && !showComplete) return null;

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Card className={`transition-all duration-500 ${
      allDone
        ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
        : allAutoDone
          ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
          : "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20"
    }`}>
      <CardContent className="py-3">
        <div className="flex items-center gap-3">
          {/* Spinner or checkmark */}
          <div className="relative h-5 w-5 shrink-0">
            {allDone ? (
              <span className="text-green-500 text-lg">✓</span>
            ) : (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-800" />
                <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              </>
            )}
          </div>

          <div className="flex-1">
            {/* Title */}
            <p className={`text-sm font-medium ${allDone ? "text-green-700 dark:text-green-300" : allAutoDone ? "text-amber-700 dark:text-amber-300" : "text-blue-700 dark:text-blue-300"}`}>
              {allDone ? "모든 데이터 로딩 완료!" : allAutoDone ? "자동 로딩 완료 — AI 분석/목표가는 버튼을 눌러주세요" : `데이터 로딩 중${dots}`}
            </p>

            {/* Step checkboxes - grouped */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[9px] text-slate-400 dark:text-zinc-500">자동</span>
              {autoSteps.map((step) => (
                <span key={step.label} className="flex items-center gap-1 text-[11px]">
                  <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded border text-[9px] ${
                    step.done
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-slate-300 dark:border-zinc-600 text-transparent"
                  }`}>✓</span>
                  <span className={step.done ? "text-slate-500 dark:text-zinc-400 line-through" : "text-blue-600 dark:text-blue-400 font-medium"}>
                    {step.label}
                  </span>
                </span>
              ))}
              <span className="text-slate-200 dark:text-zinc-700 mx-0.5">|</span>
              <span className="text-[9px] text-slate-400 dark:text-zinc-500">수동</span>
              {manualSteps.map((step) => (
                <span key={step.label} className="flex items-center gap-1 text-[11px]">
                  <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded border text-[9px] ${
                    step.done
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-amber-300 dark:border-amber-700 text-transparent"
                  }`}>✓</span>
                  <span className={step.done ? "text-slate-500 dark:text-zinc-400 line-through" : "text-amber-600 dark:text-amber-400"}>
                    {step.label}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Progress count */}
          <span className={`text-[10px] shrink-0 ${allDone ? "text-green-400" : "text-blue-400 dark:text-blue-600"}`}>
            {doneCount}/{steps.length}
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
