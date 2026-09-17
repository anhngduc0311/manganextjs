import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import { UpsertChapterDto } from "./dto/chapters.dto";

const READER_DATA_TTL_SECONDS = 60 * 60; // 1 hour

@Injectable()
export class ChaptersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getReaderData(comicSlug: string, chapterNumber: number) {
    const cacheKey = `reader:${comicSlug}:${chapterNumber}`;

    return this.redis.cached(
      cacheKey,
      [`chapter-${comicSlug}-${chapterNumber}`, `comic-${comicSlug}`],
      READER_DATA_TTL_SECONDS,
      async () => {
        const comic = await this.prisma.comic.findUnique({
          where: { slug: comicSlug },
          select: { id: true, title: true, slug: true, coverImage: true, _count: { select: { chapters: true } } },
        });
        if (!comic) return null;

        const chapter = await this.prisma.chapter.findUnique({
          where: { comicId_chapterNumber: { comicId: comic.id, chapterNumber } },
          select: { id: true, chapterNumber: true, title: true, views: true },
        });
        if (!chapter) return null;

        const rows = await this.prisma.chapterPage.findMany({
          where: { chapterId: chapter.id },
          orderBy: { pageIndex: "asc" },
          select: { pageIndex: true, imageUrl: true },
        });
        const pages = rows.map((r) => ({ pageIndex: r.pageIndex, imageUrl: r.imageUrl }));

        const [prev, next] = await Promise.all([
          this.prisma.chapter.findFirst({
            where: { comicId: comic.id, chapterNumber: { lt: chapterNumber } },
            orderBy: { chapterNumber: "desc" },
            select: { chapterNumber: true },
          }),
          this.prisma.chapter.findFirst({
            where: { comicId: comic.id, chapterNumber: { gt: chapterNumber } },
            orderBy: { chapterNumber: "asc" },
            select: { chapterNumber: true },
          }),
        ]);

        return {
          comic: { id: comic.id, title: comic.title, slug: comic.slug, coverImage: comic.coverImage },
          chapter: {
            id: chapter.id,
            chapterNumber: chapter.chapterNumber,
            title: chapter.title,
            views: Number(chapter.views),
          },
          pages,
          prevChapterNumber: prev?.chapterNumber ?? null,
          nextChapterNumber: next?.chapterNumber ?? null,
          totalChapters: comic._count.chapters,
        };
      },
    );
  }

  async listChaptersByComicId(comicId: string) {
    return this.redis.cached(`comic:${comicId}:chapters`, [`comic-chapters-${comicId}`], 600, async () => {
      const rows = await this.prisma.chapter.findMany({
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
  }

  async listChaptersAdmin(comicId: string) {
    return this.prisma.chapter.findMany({
      where: { comicId },
      orderBy: { chapterNumber: "desc" },
      select: {
        id: true,
        chapterNumber: true,
        title: true,
        views: true,
        createdAt: true,
        _count: { select: { pages: true } },
      },
    });
  }

  async upsertChapter(dto: UpsertChapterDto) {
    const pagesOrdered = [...dto.pages]
      .sort((a, b) => a.pageIndex - b.pageIndex)
      .map((p, i) => ({ pageIndex: i, imageUrl: p.imageUrl }));

    const chapter = await this.prisma.$transaction(async (tx) => {
      const upserted = await tx.chapter.upsert({
        where: { comicId_chapterNumber: { comicId: dto.comicId, chapterNumber: dto.chapterNumber } },
        create: {
          comicId: dto.comicId,
          chapterNumber: dto.chapterNumber,
          title: dto.title || null,
          pages: { create: pagesOrdered },
        },
        update: {
          title: dto.title || null,
          pages: { deleteMany: {}, create: pagesOrdered },
        },
        select: { id: true, comicId: true },
      });

      const chapterCount = await tx.chapter.count({ where: { comicId: dto.comicId } });
      const latest = await tx.chapter.findFirst({
        where: { comicId: dto.comicId },
        orderBy: { chapterNumber: "desc" },
        select: { chapterNumber: true },
      });

      await tx.comic.update({
        where: { id: dto.comicId },
        data: {
          updatedAt: new Date(),
          chapterCount,
          latestChapterNumber: latest?.chapterNumber ?? dto.chapterNumber,
        },
      });

      return upserted;
    });

    const comic = await this.prisma.comic.findUnique({
      where: { id: dto.comicId },
      select: { slug: true },
    });

    if (comic) {
      await this.redis.invalidateTags(
        `comic-detail-${comic.slug}`,
        `comic-${comic.slug}`,
        `chapter-${comic.slug}-${dto.chapterNumber}`,
        `comic-chapters-${dto.comicId}`,
        "home-feed",
        "comic-list",
      );
    }

    return chapter;
  }

  async deleteChapter(chapterId: string) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { comic: { select: { id: true, slug: true } } },
    });

    if (!chapter) {
      throw new NotFoundException("Chương không tồn tại");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.chapter.delete({ where: { id: chapterId } });
      const chapterCount = await tx.chapter.count({ where: { comicId: chapter.comicId } });
      const latest = await tx.chapter.findFirst({
        where: { comicId: chapter.comicId },
        orderBy: { chapterNumber: "desc" },
        select: { chapterNumber: true },
      });

      await tx.comic.update({
        where: { id: chapter.comicId },
        data: {
          updatedAt: new Date(),
          chapterCount,
          latestChapterNumber: latest?.chapterNumber ?? null,
        },
      });
    });

    await this.redis.invalidateTags(
      `comic-detail-${chapter.comic.slug}`,
      `comic-${chapter.comic.slug}`,
      `chapter-${chapter.comic.slug}-${chapter.chapterNumber}`,
      `comic-chapters-${chapter.comicId}`,
      "home-feed",
      "comic-list",
    );

    return { success: true };
  }
}
