"use client";

import { useEffect } from "react";
import { create } from "zustand";

export type TZ = "Asia/Seoul" | "America/New_York";

interface TZState {
  tz: TZ;
  setTZ: (tz: TZ) => void;
}

export const useTZStore = create<TZState>((set) => ({
  tz: "Asia/Seoul",
  setTZ: (tz) => set({ tz }),
}));

export function useInitTZ() {
  const setTZ = useTZStore((s) => s.setTZ);
  useEffect(() => {
    const saved = localStorage.getItem("investinfo_tz") as TZ | null;
    if (saved) setTZ(saved);
  }, [setTZ]);
}

export function useTZToggle() {
  const tz = useTZStore((s) => s.tz);
  const setTZ = useTZStore((s) => s.setTZ);
  return () => {
    const next: TZ = tz === "Asia/Seoul" ? "America/New_York" : "Asia/Seoul";
    setTZ(next);
    localStorage.setItem("investinfo_tz", next);
  };
}

/** Format a date string or Date in current timezone */
export function formatInTZ(date: Date | string, tz: TZ, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("ko-KR", {
    timeZone: tz,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    ...opts,
  });
}
