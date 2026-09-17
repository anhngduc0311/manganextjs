import { NextResponse } from "next/server";
import { searchService } from "@/services/search.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 5), 20);

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchService.quickSuggest(q, limit);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ results: [], error: "Lỗi tìm kiếm" }, { status: 500 });
  }
}
