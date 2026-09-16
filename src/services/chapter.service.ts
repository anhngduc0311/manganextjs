import { prisma } from "@/lib/prisma";
import { cacheService } from "@/services/cache.service";
import type { PageDTO, ReaderDataDTO } from "@/types";

const PAGES_TTL_SECONDS = 2 * 60 * 60;

export const chapterService = {
  async getReaderData(comicSlug: string, chapterNumber: number): Promise<ReaderDataDTO | null> {
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

    const cacheKey = `chapter:${chapter.id}:pages`;
    let pages = await cacheService.getJson<PageDTO[]>(cacheKey);
    if (!pages || pages.length === 0) {
      const rows = await prisma.chapterPage.findMany({
        where: { chapterId: chapter.id },
        orderBy: { pageIndex: "asc" },
        select: { pageIndex: true, imageUrl: true },
      });
      pages = rows.map((r) => ({ pageIndex: r.pageIndex, imageUrl: r.imageUrl }));
      await cacheService.setJson(cacheKey, pages, PAGES_TTL_SECONDS);
    }

    cacheService.incrView(comic.id, chapter.id).catch(() => {});

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
  },

  async listChaptersAdmin(comicId: string) {
    return prisma.chapter.findMany({
      where: { comicId },
      orderBy: { chapterNumber: "desc" },
      select: { id: true, chapterNumber: true, title: true, views: true, createdAt: true, _count: { select: { pages: true } } },
    });
  },
};
