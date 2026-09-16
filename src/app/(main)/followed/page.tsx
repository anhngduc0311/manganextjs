import React from "react";
import { redirect } from "next/navigation";

import { Bookmark } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ComicGrid } from "@/components/comic/ComicGrid";
import type { ComicCardDTO } from "@/types";

export const metadata = {
  title: "Truyện Đang Theo Dõi — TruyenKomi",
  description: "Danh sách các bộ truyện tranh bạn đã bookmark và theo dõi để nhận thông báo chương mới.",
};

export default async function FollowedPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/followed");
  }

  const follows = await prisma.follow.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      comic: {
        include: {
          categories: { include: { category: true } },
          _count: { select: { chapters: true } },
        },
      },
    },
  });

  const comics: ComicCardDTO[] = follows.map((f) => ({
    id: f.comic.id,
    title: f.comic.title,
    slug: f.comic.slug,
    coverImage: f.comic.coverImage,
    status: f.comic.status,
    views: Number(f.comic.views),
    ratingAvg: f.comic.ratingAvg,
    ratingCount: f.comic.ratingCount,
    chapterCount: f.comic._count.chapters,
    updatedAt: f.comic.updatedAt.toISOString(),
    categories: f.comic.categories.map((gc) => ({ name: gc.category.name, slug: gc.category.slug })),
  }));

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-orange-500/10 via-zinc-900 to-zinc-900 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 mb-1">
          <Bookmark className="h-4 w-4" /> Kệ sách yêu thích
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">Truyện Đang Theo Dõi</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          Tổng cộng bạn đang theo dõi {comics.length} bộ truyện. Bạn sẽ nhận được thông báo khi có chương mới phát hành.
        </p>
      </div>

      {/* Comics Grid */}
      <ComicGrid
        comics={comics}
        emptyMessage="Bạn chưa theo dõi bộ truyện nào. Hãy bấm nút 'Theo dõi truyện' ở trang chi tiết để lưu vào đây nhé!"
      />
    </div>
  );
}
