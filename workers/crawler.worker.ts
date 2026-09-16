import { Worker, type Job } from "bullmq";
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
}

/**
 * Helper to run promises with concurrency limit
 */
async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await fn(items[idx], idx);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function processChapterJob(job: Job<ChapterJobData>): Promise<{ chapterId: string; pagesCount: number }> {
  const { comicId, comicSlug, comicTitle, chapterNumber, title, sourcePageUrls } = job.data;

  console.log(`[Crawler Worker] Processing Chapter ${chapterNumber} of "${comicTitle}" (${sourcePageUrls.length} pages)...`);

  // 1. Process and upload pages to R2 in parallel (concurrency limit 4)
  const uploadedPages = await mapConcurrent(
    sourcePageUrls,
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

    // Update comic timestamp
    await tx.comic.update({
      where: { id: comicId },
      data: { updatedAt: new Date() },
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
    console.log(`[Crawler Worker] Sent chapter notification to ${notifyCount} followers.`);
  } catch (err) {
    console.warn("[Crawler Worker] Notification error:", err);
  }

  // 4. Invalidate caches
  try {
    await cacheService.scanDelete(`chapter:${chapter.id}:*`);
  } catch {}

  console.log(`[Crawler Worker] Successfully saved Chapter ${chapterNumber} (${uploadedPages.length} pages) for "${comicTitle}"!`);
  return { chapterId: chapter.id, pagesCount: uploadedPages.length };
}

export function createCrawlerWorker(connection: any) {
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
    console.log(`[Crawler Worker] Job ${job.id} completed for Chapter ${job.data.chapterNumber}!`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Crawler Worker] Job ${job?.id} failed:`, err);
  });

  return worker;
}
