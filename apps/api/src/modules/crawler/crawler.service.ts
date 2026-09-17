import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import { toSlug, toUnaccent } from "@/common/utils/text-normalizer";
import { translateMangaDexGenre } from "./mangadex.service";
import { IngestPayloadDto } from "./dto/crawler.dto";

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async ingest(payload: IngestPayloadDto) {
    const { comic: comicData, chapters: chaptersData } = payload;

    // 1. Upsert categories
    const uniqueSlugs = new Set<string>();
    const categoryRecords: Array<{ id: string }> = [];

    if (comicData.categories && comicData.categories.length > 0) {
      for (const rawCat of comicData.categories) {
        if (!rawCat || !rawCat.trim()) continue;
        const catName = translateMangaDexGenre(rawCat);
        const slug = toSlug(catName);
        if (!slug || uniqueSlugs.has(slug)) continue;
        uniqueSlugs.add(slug);

        const record = await this.prisma.category.upsert({
          where: { slug },
          create: { name: catName, slug, description: `Thể loại truyện tranh ${catName}` },
          update: { name: catName },
          select: { id: true },
        });
        categoryRecords.push(record);
      }
    }

    // 2. Upsert Comic
    const comicSlug = comicData.slug || toSlug(comicData.title);
    const titleUnaccent = toUnaccent(comicData.title);

    const comic = await this.prisma.comic.upsert({
      where: { slug: comicSlug },
      create: {
        title: comicData.title,
        titleUnaccent,
        slug: comicSlug,
        otherNames: comicData.otherNames || null,
        author: comicData.author || null,
        status: comicData.status || "ONGOING",
        coverImage: comicData.coverImage || "/icons/icon-192.png",
        description: comicData.description || null,
        categories: {
          create: categoryRecords.map((cat) => ({ categoryId: cat.id })),
        },
      },
      update: {
        title: comicData.title,
        titleUnaccent,
        otherNames: comicData.otherNames || null,
        author: comicData.author || null,
        status: comicData.status || undefined,
        coverImage: comicData.coverImage || undefined,
        description: comicData.description || undefined,
        categories: categoryRecords.length > 0 ? {
          deleteMany: {},
          create: categoryRecords.map((cat) => ({ categoryId: cat.id })),
        } : undefined,
      },
      select: { id: true, slug: true, title: true },
    });

    // 3. Upsert Chapters and Pages
    let savedChaptersCount = 0;
    for (const ch of chaptersData) {
      await this.prisma.$transaction(async (tx) => {
        await tx.chapter.upsert({
          where: {
            comicId_chapterNumber: {
              comicId: comic.id,
              chapterNumber: ch.chapterNumber,
            },
          },
          create: {
            comicId: comic.id,
            chapterNumber: ch.chapterNumber,
            title: ch.title || null,
            pages: {
              create: ch.pages.map((url, pageIndex) => ({
                pageIndex,
                imageUrl: url,
              })),
            },
          },
          update: {
            title: ch.title || null,
            pages: {
              deleteMany: {},
              create: ch.pages.map((url, pageIndex) => ({
                pageIndex,
                imageUrl: url,
              })),
            },
          },
        });

        const totalChapters = await tx.chapter.count({ where: { comicId: comic.id } });
        const latest = await tx.chapter.findFirst({
          where: { comicId: comic.id },
          orderBy: { chapterNumber: "desc" },
          select: { chapterNumber: true },
        });

        await tx.comic.update({
          where: { id: comic.id },
          data: {
            chapterCount: totalChapters,
            latestChapterNumber: latest?.chapterNumber ?? ch.chapterNumber,
          },
        });
      });
      savedChaptersCount++;
    }

    await this.redis.invalidateTags("home-feed", "comic-list", "rankings", `comic-${comic.slug}`);

    return {
      ok: true,
      comicId: comic.id,
      comicSlug: comic.slug,
      savedChapters: savedChaptersCount,
      message: `Đã nạp thành công truyện "${comic.title}" và lưu ${savedChaptersCount} chương trực tiếp vào CSDL.`,
    };
  }
}
