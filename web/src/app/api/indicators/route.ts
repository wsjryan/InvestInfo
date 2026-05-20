import { NextResponse } from "next/server";
import { fetchAllIndicators } from "@/lib/api/indicators";

export async function GET() {
  const indicators = await fetchAllIndicators();
  return NextResponse.json(indicators);
}
