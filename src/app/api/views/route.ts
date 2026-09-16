import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    // Direct real-time increment in PostgreSQL (no background worker needed)
    await prisma.$transaction([
      prisma.comic.update({
        where: { id: comicId },
        data: {
          views: { increment: 1 },
          weeklyViews: { increment: 1 },
          monthlyViews: { increment: 1 },
        },
      }),
      prisma.chapter.update({
        where: { id: chapterId },
        data: {
          views: { increment: 1 },
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Lỗi ghi nhận lượt xem" }, { status: 500 });
  }
}

