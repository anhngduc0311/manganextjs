import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SafeImage } from "@/components/common/SafeImage";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { History, BookOpen, Clock, Play } from "lucide-react";

export const metadata: Metadata = {
  title: "Lịch sử đọc truyện — TruyenKomi",
  description: "Danh sách các bộ truyện bạn đã đọc gần đây",
};

export default async function ReadingHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/history");
  }

  const histories = await prisma.history.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      comic: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
        },
      },
      chapter: {
        select: {
          id: true,
          chapterNumber: true,
          title: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
          <History className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-100">Lịch Sử Đọc Truyện</h1>
          <p className="text-xs text-zinc-400">Các chương truyện bạn đang đọc dở dang</p>
        </div>
      </div>

      {histories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 py-16 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-500 mb-4">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-200">Bạn chưa đọc truyện nào</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm">
            Lịch sử đọc truyện sẽ tự động lưu lại vị trí chương gần nhất khi bạn đọc truyện trên TruyenKomi.
          </p>
          <Link
            href="/comics"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition"
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
                <SafeImage
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
