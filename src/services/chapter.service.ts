import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { cacheService } from "@/services/cache.service";
import type { PageDTO, ReaderDataDTO, ChapterDTO } from "@/types";

const READER_DATA_TTL_SECONDS = 60 * 60; // 1 hour

export const chapterService = {
  getReaderData: cache(async (comicSlug: string, chapterNumber: number): Promise<ReaderDataDTO | null> => {
    const cacheKey = `reader:${comicSlug}:${chapterNumber}`;

    return cacheService.cached(cacheKey, [`chapter-${comicSlug}-${chapterNumber}`, `comic-${comicSlug}`], READER_DATA_TTL_SECONDS, async () => {
      const comic = await prisma.comic.findUnique({
        where: { slug: comicSlug },
        select: { id: true, title: true, slug: true, coverImage: true, _count: { select: { chapters: true } } },
      });
      if (!comic) return null;

      const chapter = await prisma.chapter.findUnique({
        where: { comicId_chapterNumber: { comicId: comic.id, chapterNumber } },
        select: { id: true, chapterNumber: true, title: true, views: true },
      });
      if (!chapter) return null;

      const rows = await prisma.chapterPage.findMany({
        where: { chapterId: chapter.id },
        orderBy: { pageIndex: "asc" },
        select: { pageIndex: true, imageUrl: true },
      });
      const pages: PageDTO[] = rows.map((r) => ({ pageIndex: r.pageIndex, imageUrl: r.imageUrl }));

      const [prev, next] = await Promise.all([
        prisma.chapter.findFirst({
          where: { comicId: comic.id, chapterNumber: { lt: chapterNumber } },
          orderBy: { chapterNumber: "desc" },
          select: { chapterNumber: true },
        }),
        prisma.chapter.findFirst({
          where: { comicId: comic.id, chapterNumber: { gt: chapterNumber } },
          orderBy: { chapterNumber: "asc" },
          select: { chapterNumber: true },
        }),
      ]);

      return {
        comic: { id: comic.id, title: comic.title, slug: comic.slug, coverImage: comic.coverImage },
        chapter: { id: chapter.id, chapterNumber: chapter.chapterNumber, title: chapter.title, views: Number(chapter.views) },
        pages,
        prevChapterNumber: prev?.chapterNumber ?? null,
        nextChapterNumber: next?.chapterNumber ?? null,
        totalChapters: comic._count.chapters,
      };
    });
  }),

  listChaptersByComicId: cache(async (comicId: string): Promise<ChapterDTO[]> => {
    return cacheService.cached(`comic:${comicId}:chapters`, [`comic-chapters-${comicId}`], 600, async () => {
      const rows = await prisma.chapter.findMany({
        where: { comicId },
        select: { id: true, chapterNumber: true, title: true, views: true, createdAt: true },
        orderBy: { chapterNumber: "desc" },
      });
      return rows.map((ch) => ({
        id: ch.id,
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        views: Number(ch.views),
        createdAt: ch.createdAt.toISOString(),
      }));
    });
  }),

  async listChaptersAdmin(comicId: string) {
    return prisma.chapter.findMany({
      where: { comicId },
      orderBy: { chapterNumber: "desc" },
      select: { id: true, chapterNumber: true, title: true, views: true, createdAt: true, _count: { select: { pages: true } } },
    });
  },
};

