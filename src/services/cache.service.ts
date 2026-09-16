import { unstable_cache } from "next/cache";
import { redisRest } from "@/lib/redis";
import { logger } from "@/lib/logger";

const SCAN_COUNT = 100;

export const cacheService = {
  async getJson<T>(key: string): Promise<T | null> {
    if (!redisRest) return null;
    try {
      return await redisRest.get<T>(key);
    } catch (err) {
      logger.warn({ err, key }, "redis get that bai, fallback DB");
      return null;
    }
  },

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!redisRest) return;
    try {
      await redisRest.set(key, value, { ex: ttlSeconds });
    } catch (err) {
      logger.warn({ err, key }, "redis set that bai");
    }
  },

  async del(...keys: string[]): Promise<void> {
    if (!redisRest || keys.length === 0) return;
    try {
      await redisRest.del(...keys);
    } catch (err) {
      logger.warn({ err }, "redis del that bai");
    }
  },

  async incr(key: string): Promise<number> {
    if (!redisRest) return 0;
    try {
      return await redisRest.incr(key);
    } catch {
      return 0;
    }
  },

  async incrView(comicId: string, chapterId: string): Promise<void> {
    if (!redisRest) return;
    try {
      await Promise.all([
        redisRest.incr(`comic:views:${comicId}`),
        redisRest.incr(`chapter:views:${chapterId}`),
      ]);
    } catch (err) {
      logger.warn({ err }, "incr view that bai");
    }
  },

  async scanDelete(pattern: string): Promise<number> {
    if (!redisRest) return 0;
    let cursor = "0";
    let deleted = 0;
    try {
      do {
        const [next, keys] = await redisRest.scan(cursor, { match: pattern, count: SCAN_COUNT });
        cursor = next;
        if (keys.length > 0) {
          await redisRest.del(...keys);
          deleted += keys.length;
        }
      } while (cursor !== "0");
    } catch (err) {
      logger.warn({ err, pattern }, "scan delete that bai");
    }
    return deleted;
  },

  async cached<T>(key: string, tags: string[], revalidateSeconds: number, fn: () => Promise<T>): Promise<T> {
    return unstable_cache(fn, [key], { tags, revalidate: revalidateSeconds })();
  },
};
