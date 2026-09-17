import React from "react";
import { prisma } from "@/lib/prisma";
import { ComicsTable, type ComicRow } from "@/components/admin/ComicsTable";
import type { CategoryDTO } from "@/types";

export const metadata = {
  title: "Quản Lý Truyện — TruyenKomi Admin",
};

export default async function AdminComicsPage() {
  const [comicsRows, categoriesRows, chapter1Comics] = await Promise.all([
    prisma.comic.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        categories: { include: { category: { select: { id: true, name: true } } } },
        _count: { select: { chapters: true } },
        chapters: {
          orderBy: { chapterNumber: "asc" },
          take: 1,
          select: { chapterNumber: true },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, description: true },
    }),
    prisma.chapter.findMany({
      where: { chapterNumber: 1 },
      select: { comicId: true },
      distinct: ["comicId"],
    }),
  ]);

  const comicIdsWithChapter1 = new Set(chapter1Comics.map((c) => c.comicId));

  const comics: ComicRow[] = comicsRows.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    otherNames: c.otherNames,
    author: c.author,
    status: c.status,
    coverImage: c.coverImage,
    bannerImage: c.bannerImage,
    description: c.description,
    views: Number(c.views),
    ratingAvg: c.ratingAvg,
    ratingCount: c.ratingCount,
    chapterCount: c._count.chapters,
    hasChapter1: comicIdsWithChapter1.has(c.id),
    firstChapterNumber: c.chapters[0]?.chapterNumber ?? null,
    updatedAt: c.updatedAt.toISOString(),
    categories: c.categories.map((cg) => ({ id: cg.category.id, name: cg.category.name })),
  }));

  const categories: CategoryDTO[] = categoriesRows.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Quản Lý Kho Truyện Tranh
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Xem danh sách, thêm bộ truyện mới, cập nhật thông tin và điều hướng quản lý chương ảnh.
        </p>
      </div>

      <ComicsTable initialComics={comics} categories={categories} />
    </div>
  );
}
