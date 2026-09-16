import { NextRequest, NextResponse } from "next/server";
import { cacheService } from "@/services/cache.service";
import { viewSchema } from "@/types/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = viewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const { comicId, chapterId } = parsed.data;

    // Asynchronously buffer the view in Redis
    await cacheService.incrView(comicId, chapterId);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Lỗi ghi nhận lượt xem" }, { status: 500 });
  }
}
