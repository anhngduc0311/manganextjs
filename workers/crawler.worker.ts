import { Worker, type Job, type ConnectionOptions } from "bullmq";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/services/notification.service";
import { processAndUploadChapterPage } from "./image-processor";
import { cacheService } from "@/services/cache.service";

export interface ChapterJobData {
  comicId: string;
  comicSlug: string;
  comicTitle: string;
  chapterNumber: number;
  title?: string;
  sourcePageUrls: string[];
  force?: boolean;
}

/**
 * Helper to run promises with concurrency limit
 */
async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (!items || items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await fn(items[idx], idx);
    }
  }

  const workerCount = Math.min(limit, items.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function processChapterJob(
  job: Job<ChapterJobData> | { data: ChapterJobData }
): Promise<{ chapterId: string; pagesCount: number }> {
  const { comicId, comicSlug, comicTitle, chapterNumber, title, sourcePageUrls, force } = job.data;
  const urls = Array.isArray(sourcePageUrls) ? sourcePageUrls : [];

  // Check if chapter already exists in database with pages (skip redundant crawling/uploading)
  if (!force) {
    try {
      const existing = await prisma.chapter.findUnique({
        where: {
          comicId_chapterNumber: {
            comicId,
            chapterNumber,
          },
        },
        include: { _count: { select: { pages: true } } },
      });

      if (existing && existing._count.pages > 0) {
        console.log(`[Crawler Worker] ⏩ Chapter ${chapterNumber} of "${comicTitle}" already exists (${existing._count.pages} pages). Skipping.`);
        return { chapterId: existing.id, pagesCount: existing._count.pages };
      }
    } catch {
      // Fallback to normal processing if query fails
    }
  }

  console.log(`[Crawler Worker] Processing Chapter ${chapterNumber} of "${comicTitle}" (${urls.length} pages)...`);

  // 1. Process and upload pages to R2 in parallel (concurrency limit 4)
  const uploadedPages = await mapConcurrent(
    urls,
    4,
    async (url, pageIndex) => {
      try {
        const uploadedUrl = await processAndUploadChapterPage(comicSlug, chapterNumber, pageIndex, url);
        return { pageIndex, imageUrl: uploadedUrl };
      } catch (err) {
        console.warn(`[Crawler Worker] Failed to optimize page ${pageIndex} (${url}), using fallback direct url.`, err);
        return { pageIndex, imageUrl: url };
      }
    }
  );

  // 2. Upsert Chapter + Pages in Database
  const chapter = await prisma.$transaction(async (tx) => {
    const ch = await tx.chapter.upsert({
      where: {
        comicId_chapterNumber: {
          comicId,
          chapterNumber,
        },
      },
      create: {
        comicId,
        chapterNumber,
        title: title || null,
        pages: {
          create: uploadedPages,
        },
      },
      update: {
        title: title || null,
        pages: {
          deleteMany: {},
          create: uploadedPages,
        },
      },
      select: { id: true },
    });

    // Update comic timestamp, count and latest chapter
    const chapterCount = await tx.chapter.count({ where: { comicId } });
    const latest = await tx.chapter.findFirst({
      where: { comicId },
      orderBy: { chapterNumber: "desc" },
      select: { chapterNumber: true },
    });

    await tx.comic.update({
      where: { id: comicId },
      data: {
        updatedAt: new Date(),
        chapterCount,
        latestChapterNumber: latest?.chapterNumber ?? chapterNumber,
      },
    });

    return ch;
  });

  // 3. Notify followers about new chapter
  try {
    const notifyCount = await notificationService.notifyFollowers(comicId, {
      title: `Chương mới: ${comicTitle}`,
      message: `Chương ${chapterNumber} ${title ? `— ${title}` : ""} vừa được cập nhật. Đọc ngay!`,
      linkUrl: `/comics/${comicSlug}/chuong-${chapterNumber}`,
    });
    if (notifyCount > 0) {
      console.log(`[Crawler Worker] Sent chapter notification to ${notifyCount} followers.`);
    }
  } catch (err) {
    console.warn("[Crawler Worker] Notification warning:", err);
  }

  // 4. Invalidate caches
  try {
    await Promise.allSettled([
      cacheService.del(
        `comic:${comicSlug}`,
        `comic:${comicId}:chapters`,
        `reader:${comicSlug}:${chapterNumber}`,
        "home-feed"
      ),
      cacheService.scanDelete(`chapter:${chapter.id}:*`),
      cacheService.scanDelete("comics:list:*"),
    ]);
  } catch (err) {
    console.warn("[Crawler Worker] Cache invalidation warning:", err);
  }

  // 5. Sync Meilisearch search index
  try {
    const { meiliService } = await import("@/lib/meilisearch");
    const comicDoc = await prisma.comic.findUnique({
      where: { id: comicId },
      include: { categories: { include: { category: true } } },
    });
    if (comicDoc) {
      await meiliService.indexComics([
        {
          id: comicDoc.id,
          title: comicDoc.title,
          titleUnaccent: comicDoc.titleUnaccent,
          slug: comicDoc.slug,
          otherNames: comicDoc.otherNames,
          author: comicDoc.author,
          status: comicDoc.status,
          coverImage: comicDoc.coverImage,
          views: Number(comicDoc.views),
          ratingAvg: comicDoc.ratingAvg,
          ratingCount: comicDoc.ratingCount,
          chapterCount: comicDoc.chapterCount,
          categories: comicDoc.categories.map((c) => c.category.name),
          updatedAt: comicDoc.updatedAt.toISOString(),
          createdAt: comicDoc.createdAt.toISOString(),
        },
      ]);
    }
  } catch (err) {
    console.warn("[Crawler Worker] Meilisearch index sync warning:", err);
  }

  console.log(`[Crawler Worker] Successfully saved Chapter ${chapterNumber} (${uploadedPages.length} pages) for "${comicTitle}"!`);
  return { chapterId: chapter.id, pagesCount: uploadedPages.length };
}

export function createCrawlerWorker(connection: ConnectionOptions) {
  const worker = new Worker<ChapterJobData>(
    "ingestion",
    async (job) => {
      return processChapterJob(job);
    },
    {
      connection,
      concurrency: 2,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Crawler Worker] Job ${job?.id} completed for Chapter ${job?.data?.chapterNumber}!`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Crawler Worker] Job ${job?.id} failed:`, err);
  });

  return worker;
}
