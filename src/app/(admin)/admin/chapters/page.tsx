import React from "react";
import { prisma } from "@/lib/prisma";
import {
  ChaptersManager,
  type ComicOption,
  type ChapterRow,
} from "@/components/admin/ChaptersManager";

export const metadata = {
  title: "Quản Lý Chương Truyện — TruyenKomi Admin",
};

interface AdminChaptersPageProps {
  searchParams: Promise<{ comicId?: string }>;
}

export default async function AdminChaptersPage({ searchParams }: AdminChaptersPageProps) {
  const { comicId } = await searchParams;

  const comicsRows = await prisma.comic.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      _count: { select: { chapters: true } },
    },
  });

  const comics: ComicOption[] = comicsRows.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    chapterCount: c._count.chapters,
  }));

  const activeComicId = comicId || comics[0]?.id || "";

  let chapters: ChapterRow[] = [];
  if (activeComicId) {
    const chaptersRows = await prisma.chapter.findMany({
      where: { comicId: activeComicId },
      orderBy: { chapterNumber: "desc" },
      include: {
        pages: {
          orderBy: { pageIndex: "asc" },
          select: { imageUrl: true },
        },
      },
    });

    chapters = chaptersRows.map((ch) => ({
      id: ch.id,
      chapterNumber: ch.chapterNumber,
      title: ch.title,
      views: Number(ch.views),
      pageCount: ch.pages.length,
      createdAt: ch.createdAt.toISOString(),
      pages: ch.pages.map((p) => p.imageUrl),
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Quản Lý Chương & Trang Ảnh
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Chọn bộ truyện để quản lý các chương, đăng chương mới và tải ảnh lên Cloudflare R2.
        </p>
      </div>

      <ChaptersManager
        comics={comics}
        selectedComicId={activeComicId}
        chapters={chapters}
      />
    </div>
  );
}
