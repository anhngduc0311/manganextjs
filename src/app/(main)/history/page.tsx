import React from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { History as HistoryIcon, BookOpen, Clock, Play } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Lịch Sử Đọc Truyện — TruyenKomi",
  description: "Xem lại danh sách các bộ truyện tranh bạn đang đọc dở và tiếp tục thưởng thức.",
};

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/history");
  }

  const histories = await prisma.history.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      comic: {
        select: { id: true, title: true, slug: true, coverImage: true, _count: { select: { chapters: true } } },
      },
      chapter: {
        select: { id: true, chapterNumber: true, title: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-orange-500/10 via-zinc-900 to-zinc-900 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 mb-1">
          <HistoryIcon className="h-4 w-4" /> Tiến trình đọc truyện
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">Lịch Sử Đọc Truyện</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          Danh sách các bộ truyện bạn đang đọc. Hệ thống tự động ghi nhớ chương gần nhất để bạn đọc tiếp tiện lợi.
        </p>
      </div>

      {/* History List */}
      {histories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
          <HistoryIcon className="h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-sm font-semibold text-zinc-300">Lịch sử đọc của bạn đang trống</p>
          <p className="mt-1 text-xs text-zinc-500">Hãy khám phá thư viện truyện tranh và bắt đầu đọc nhé!</p>
          <Link
            href="/comics"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 transition"
          >
            <BookOpen className="h-4 w-4" /> Khám phá truyện ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {histories.map((h) => (
            <div
              key={`${h.userId}-${h.comicId}`}
              className="flex items-center gap-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 transition hover:border-zinc-700"
            >
              {/* Cover thumbnail */}
              <Link
                href={`/comics/${h.comic.slug}`}
                className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-800"
              >
                <Image
                  src={h.comic.coverImage || "/icons/icon-192.png"}
                  alt={h.comic.title}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </Link>

              {/* Meta & continue button */}
              <div className="flex flex-1 flex-col justify-between min-w-0 h-full py-0.5">
                <div>
                  <Link
                    href={`/comics/${h.comic.slug}`}
                    className="truncate block text-sm font-bold text-zinc-100 hover:text-orange-400 transition"
                    title={h.comic.title}
                  >
                    {h.comic.title}
                  </Link>
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-orange-400">
                    Đang đọc: Chương {h.chapter.chapterNumber}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-500">
                    <Clock className="h-3 w-3" />
                    {new Date(h.updatedAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="mt-3">
                  <Link
                    href={`/comics/${h.comic.slug}/chuong-${h.chapter.chapterNumber}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500/15 border border-orange-500/30 px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-500 hover:text-white transition"
                  >
                    <Play className="h-3 w-3 fill-current" /> Đọc tiếp
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
