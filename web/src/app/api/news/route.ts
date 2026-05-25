import { NextRequest, NextResponse } from "next/server";
import { fetchNewsRSS, toNewsArticles } from "@/lib/api/news";

const cache: Record<string, { data: any; ts: number }> = {};
const CACHE_TTL = 60 * 1000;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  const lang = req.nextUrl.searchParams.get("lang") ?? "ko";
  if (!query) {
    return NextResponse.json({ error: "q parameter required" }, { status: 400 });
  }

  const cacheKey = `${query}:${lang}`;
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const items = await fetchNewsRSS(query, lang);
  const articles = toNewsArticles(items);

  cache[cacheKey] = { data: articles, ts: Date.now() };
  return NextResponse.json(articles);
}
