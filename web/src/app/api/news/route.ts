import { NextRequest, NextResponse } from "next/server";
import { fetchNewsRSS, toNewsArticles } from "@/lib/api/news";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  const lang = req.nextUrl.searchParams.get("lang") ?? "ko";
  if (!query) {
    return NextResponse.json({ error: "q parameter required" }, { status: 400 });
  }
  const rssItems = await fetchNewsRSS(query, lang);
  const articles = toNewsArticles(rssItems);
  return NextResponse.json(articles);
}
