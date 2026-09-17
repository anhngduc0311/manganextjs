import { prisma } from "@/lib/prisma";
import { redisRest } from "@/lib/redis";

/**
 * Scan all keys matching a pattern in Redis using SCAN cursor (safe, non-blocking)
 */
async function scanKeys(pattern: string): Promise<string[]> {
  if (!redisRest) return [];
  const foundKeys: string[] = [];
  let cursor = 0;

  try {
    do {
      const [nextCursor, keys] = await redisRest.scan(cursor, { match: pattern, count: 100 });
      cursor = typeof nextCursor === "number" ? nextCursor : parseInt(nextCursor, 10);
      if (keys && keys.length > 0) {
        foundKeys.push(...keys);
      }
    } while (cursor !== 0);
  } catch (err) {
    console.error("[View Sync Worker] Redis SCAN error:", err);
  }

  return foundKeys;
}

/**
 * Flush buffered views from Redis keys into Neon PostgreSQL in batch
 */
export async function syncBufferedViews(): Promise<{ syncedComics: number; syncedChapters: number }> {
  if (!redisRest) return { syncedComics: 0, syncedChapters: 0 };

  let syncedComics = 0;
  let syncedChapters = 0;

  try {
    // 1. Sync Comic Views
    const comicKeys = await scanKeys("comic:views:*");
    if (comicKeys.length > 0) {
      for (const key of comicKeys) {
        const comicId = key.replace("comic:views:", "");
        // Atomically get and delete to eliminate race condition
        const rawCount = await redisRest.getdel<number | string>(key);
        const count = typeof rawCount === "number" ? rawCount : parseInt(String(rawCount || "0"), 10);

        if (count > 0) {
          await prisma.comic.update({
            where: { id: comicId },
            data: {
              views: { increment: BigInt(count) },
              weeklyViews: { increment: BigInt(count) },
              monthlyViews: { increment: BigInt(count) },
            },
          }).catch((err) => {
            console.warn(`[View Sync Worker] Comic ${comicId} not found or update error:`, err.message);
          });
          syncedComics++;
        }
      }
    }

    // 2. Sync Chapter Views
    const chapterKeys = await scanKeys("chapter:views:*");
    if (chapterKeys.length > 0) {
      for (const key of chapterKeys) {
        const chapterId = key.replace("chapter:views:", "");
        // Atomically get and delete
        const rawCount = await redisRest.getdel<number | string>(key);
        const count = typeof rawCount === "number" ? rawCount : parseInt(String(rawCount || "0"), 10);

        if (count > 0) {
          await prisma.chapter.update({
            where: { id: chapterId },
            data: {
              views: { increment: BigInt(count) },
            },
          }).catch((err) => {
            console.warn(`[View Sync Worker] Chapter ${chapterId} not found or update error:`, err.message);
          });
          syncedChapters++;
        }
      }
    }

    if (syncedComics > 0 || syncedChapters > 0) {
      console.log(`[View Sync Worker] Synced views: ${syncedComics} comics, ${syncedChapters} chapters.`);
    }
  } catch (err) {
    console.error("[View Sync Worker] Error syncing views to DB:", err);
  }

  return { syncedComics, syncedChapters };
}

/**
 * Check and reset weekly / monthly views if time boundary crossed
 */
export async function checkPeriodicReset(): Promise<void> {
  const now = new Date();

  // Reset weekly views every Sunday at 00:00
  if (now.getDay() === 0 && now.getHours() === 0 && now.getMinutes() < 2) {
    console.log("[View Sync Worker] Resetting weekly views...");
    await prisma.comic.updateMany({ data: { weeklyViews: 0 } }).catch(() => {});
  }

  // Reset monthly views on 1st of month at 00:00
  if (now.getDate() === 1 && now.getHours() === 0 && now.getMinutes() < 2) {
    console.log("[View Sync Worker] Resetting monthly views...");
    await prisma.comic.updateMany({ data: { monthlyViews: 0 } }).catch(() => {});
  }
}
