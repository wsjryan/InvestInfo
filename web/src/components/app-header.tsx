"use client";

import Link from "next/link";
import { useAuthStore, useInitAuth, signInWithGoogle, signOut } from "@/lib/auth-store";
import { supabaseConfigured } from "@/lib/supabase";
import { useThemeStore, useThemeToggle, useInitTheme } from "@/lib/theme";
import { useTZStore, useTZToggle, useInitTZ } from "@/lib/timezone";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  useInitAuth();
  useInitTheme();
  useInitTZ();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeToggle();
  const tz = useTZStore((s) => s.tz);
  const toggleTZ = useTZToggle();
  const hasSupabase = supabaseConfigured();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80">
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            InvestInfo
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleTZ} className="h-8 px-2 text-[11px] font-mono">
            {tz === "Asia/Seoul" ? "KST" : "EST"}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleTheme} className="h-8 w-8 p-0">
            {theme === "light" ? "🌙" : "☀️"}
          </Button>

          {hasSupabase ? (
            loading ? (
              <span className="text-xs text-slate-400">...</span>
            ) : user ? (
              <div className="flex items-center gap-2">
                {user.user_metadata?.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="w-7 h-7 rounded-full"
                  />
                )}
                <span className="text-xs text-slate-600 dark:text-zinc-300 hidden sm:inline max-w-[120px] truncate">
                  {user.email}
                </span>
                <Button variant="outline" size="sm" onClick={() => signOut()} className="h-8 text-xs">
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => signInWithGoogle().catch((e) => alert(String(e)))}
                className="h-8 text-xs"
              >
                Google Login
              </Button>
            )
          ) : (
            <span className="text-xs text-slate-400">Login disabled</span>
          )}
        </div>
      </div>
    </header>
  );
}
