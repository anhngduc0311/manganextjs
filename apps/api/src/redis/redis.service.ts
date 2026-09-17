import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly inMemoryCache = new Map<string, { value: any; expiresAt: number }>();

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const redisUrl =
      this.config.get<string>("REDIS_URL") ||
      this.config.get<string>("UPSTASH_REDIS_URL_TCP");

    if (redisUrl) {
      try {
        this.client = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true,
        });

        this.client.on("connect", () => this.logger.log("Redis connected successfully"));
        this.client.on("error", (err) => this.logger.warn(`Redis error: ${err.message}`));
      } catch (err) {
        this.logger.warn(`Failed to initialize Redis client: ${(err as Error).message}`);
      }
    } else {
      this.logger.log("No Redis URL found. Using fallback in-memory cache.");
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (this.client) {
      try {
        const raw = await this.client.get(key);
        if (raw === null || raw === undefined) return null;
        try {
          return JSON.parse(raw) as T;
        } catch {
          return raw as unknown as T;
        }
      } catch (err) {
        this.logger.warn(`Redis get failed for key "${key}": ${(err as Error).message}`);
      }
    }

    const item = this.inMemoryCache.get(key);
    if (!item) return null;
    if (item.expiresAt < Date.now()) {
      this.inMemoryCache.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (this.client) {
      try {
        const valStr = typeof value === "string" ? value : JSON.stringify(value);
        if (ttlSeconds && ttlSeconds > 0) {
          await this.client.set(key, valStr, "EX", ttlSeconds);
        } else {
          await this.client.set(key, valStr);
        }
        return;
      } catch (err) {
        this.logger.warn(`Redis set failed for key "${key}": ${(err as Error).message}`);
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
    this.inMemoryCache.set(key, { value, expiresAt });
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    if (this.client) {
      try {
        return await this.client.del(...keys);
      } catch (err) {
        this.logger.warn(`Redis del failed: ${(err as Error).message}`);
      }
    }

    let count = 0;
    for (const key of keys) {
      if (this.inMemoryCache.delete(key)) count++;
    }
    return count;
  }

  async incr(key: string): Promise<number> {
    if (this.client) {
      try {
        return await this.client.incr(key);
      } catch (err) {
        this.logger.warn(`Redis incr failed: ${(err as Error).message}`);
      }
    }

    const cur = (await this.get<number>(key)) || 0;
    const next = cur + 1;
    await this.set(key, next);
    return next;
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    if (this.client) {
      try {
        return await this.client.sadd(key, ...members);
      } catch (err) {
        this.logger.warn(`Redis sadd failed: ${(err as Error).message}`);
      }
    }
    return 1;
  }

  async cached<T>(key: string, tags: string[], ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    const cachedVal = await this.get<T>(key);
    if (cachedVal !== null && cachedVal !== undefined) {
      return cachedVal;
    }

    const fresh = await fetcher();
    if (fresh !== undefined && fresh !== null) {
      await this.set(key, fresh, ttlSeconds);
      for (const tag of tags) {
        await this.sadd(`tag:${tag}`, key);
      }
    }
    return fresh;
  }

  async invalidateTags(...tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      if (this.client) {
        try {
          const keys = await this.client.smembers(tagKey);
          if (keys.length > 0) {
            await this.client.del(...keys);
          }
          await this.client.del(tagKey);
        } catch (err) {
          this.logger.warn(`Failed to invalidate tag "${tag}": ${(err as Error).message}`);
        }
      }
    }
  }
}
