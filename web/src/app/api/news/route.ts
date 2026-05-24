import { NextRequest, NextResponse } from "next/server";
import { fetchNewsRSS, toNewsArticles } from "@/lib/api/news";

// Server-side cache: prevents hammering Google News RSS
const cache: Record<string, { data: any; ts: number }> = {};
const CACHE_TTL = 60 * 1000; // 1 min — same query returns cached result

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "q parameter required" }, { status: 400 });
  }

  // Check cache
  const cached = cache[query];
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  // Fetch both Korean and English news
  const [koItems, enItems] = await Promise.all([
    fetchNewsRSS(query, "ko"),
    fetchNewsRSS(query, "en"),
  ]);

  // Merge, deduplicate by title prefix
  const seen = new Set<string>();
  const merged = [...koItems, ...enItems].filter((item) => {
    const key = item.title.slice(0, 40).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const articles = toNewsArticles(merged);

  // Cache
  cache[query] = { data: articles, ts: Date.now() };

  return NextResponse.json(articles);
}
