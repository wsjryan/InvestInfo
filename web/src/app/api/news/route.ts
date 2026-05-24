import { NextRequest, NextResponse } from "next/server";
import { fetchNewsRSS, toNewsArticles } from "@/lib/api/news";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "q parameter required" }, { status: 400 });
  }

  // Fetch both Korean and English news for better coverage
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
  return NextResponse.json(articles);
}
