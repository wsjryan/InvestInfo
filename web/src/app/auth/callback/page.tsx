"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      router.replace("/");
      return;
    }
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (!code) {
      router.replace("/");
      return;
    }
    sb.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) setError(error.message);
        else router.replace("/");
      })
      .catch((e) => setError(String(e)));
  }, [router]);

  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center">
      {error ? (
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200">
          Login failed: {error}
          <div className="mt-2">
            <Link href="/" className="text-xs underline">
              Go home
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-500 dark:text-zinc-400">
          Authenticating...
        </div>
      )}
    </div>
  );
}
