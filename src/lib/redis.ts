import { Redis as UpstashRedis } from "@upstash/redis";
import RedisTcp from "ioredis";
import { env, hasRedis } from "@/lib/env";

export interface UnifiedRedisClient {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  scan(cursor: string | number, opts?: { match?: string; count?: number }): Promise<[string, string[]]>;
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  scard(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ping(): Promise<string>;
  getdel<T = unknown>(key: string): Promise<T | null>;
}

const tcpUrl = env.REDIS_URL || env.UPSTASH_REDIS_URL_TCP;

let tcpRedis: RedisTcp | null = null;

function getOrCreateTcpClient(): RedisTcp | null {
  if (tcpRedis) return tcpRedis;
  if (!tcpUrl) return null;
  tcpRedis = new RedisTcp(tcpUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
  });
  return tcpRedis;
}

function createUnifiedClient(): UnifiedRedisClient | null {
  if (!hasRedis) return null;

  // 1. If Upstash REST credentials exist, use Upstash Redis client
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    const upstash = new UpstashRedis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    return {
      get: <T>(key: string) => upstash.get<T>(key),
      set: async (key: string, value: unknown, opts?: { ex?: number }): Promise<string | null> => {
        const res = opts?.ex
          ? await upstash.set(key, value, { ex: opts.ex })
          : await upstash.set(key, value);
        return res ? String(res) : null;
      },
      del: (...keys: string[]) => upstash.del(...keys),
      incr: (key: string) => upstash.incr(key),
      scan: (cursor: string | number, opts?: { match?: string; count?: number }) =>
        upstash.scan(cursor, opts as any) as any,
      sadd: (key: string, ...members: string[]) => (upstash.sadd as any)(key, ...members),
      srem: (key: string, ...members: string[]) => (upstash.srem as any)(key, ...members),
      scard: (key: string) => upstash.scard(key),
      expire: (key: string, seconds: number) => upstash.expire(key, seconds),
      ping: () => upstash.ping(),
      getdel: async <T = unknown>(key: string): Promise<T | null> => {
        try {
          if (typeof (upstash as any).getdel === "function") {
            return (await (upstash as any).getdel(key)) as T;
          }
          const val = await upstash.get<T>(key);
          if (val !== null && val !== undefined) {
            await upstash.del(key);
          }
          return val;
        } catch {
          return null;
        }
      },
    };
  }

  // 2. Otherwise use local / Docker TCP Redis via ioredis
  if (tcpUrl) {
    const client = getOrCreateTcpClient();
    if (!client) return null;

    return {
      async get<T = unknown>(key: string): Promise<T | null> {
        const raw = await client.get(key);
        if (raw === null || raw === undefined) return null;
        try {
          return JSON.parse(raw) as T;
        } catch {
          return raw as unknown as T;
        }
      },

      async set(key: string, value: unknown, opts?: { ex?: number }): Promise<string | null> {
        const valStr = typeof value === "string" ? value : JSON.stringify(value);
        if (opts?.ex && opts.ex > 0) {
          return client.set(key, valStr, "EX", opts.ex);
        }
        return client.set(key, valStr);
      },

      async del(...keys: string[]): Promise<number> {
        if (keys.length === 0) return 0;
        return client.del(...keys);
      },

      async incr(key: string): Promise<number> {
        return client.incr(key);
      },

      async scan(cursor: string | number, opts?: { match?: string; count?: number }): Promise<[string, string[]]> {
        const cursorStr = String(cursor);
        const args: (string | number)[] = [cursorStr];
        if (opts?.match) {
          args.push("MATCH", opts.match);
        }
        if (opts?.count) {
          args.push("COUNT", opts.count);
        }
        const [nextCursor, keys] = await client.scan(...(args as [string]));
        return [nextCursor, keys];
      },

      async sadd(key: string, ...members: string[]): Promise<number> {
        if (members.length === 0) return 0;
        return client.sadd(key, ...members);
      },

      async srem(key: string, ...members: string[]): Promise<number> {
        if (members.length === 0) return 0;
        return client.srem(key, ...members);
      },

      async scard(key: string): Promise<number> {
        return client.scard(key);
      },

      async expire(key: string, seconds: number): Promise<number> {
        return client.expire(key, seconds);
      },

      async ping(): Promise<string> {
        return client.ping();
      },

      async getdel<T = unknown>(key: string): Promise<T | null> {
        try {
          // Native GETDEL in Redis 6.2+
          if (typeof (client as any).getdel === "function") {
            const raw = await (client as any).getdel(key);
            if (raw === null || raw === undefined) return null;
            try {
              return JSON.parse(raw) as T;
            } catch {
              return raw as unknown as T;
            }
          }
          // Fallback via atomic pipeline
          const results = await client.pipeline().get(key).del(key).exec();
          const getResult = results?.[0]?.[1];
          if (getResult === null || getResult === undefined) return null;
          const rawStr = String(getResult);
          try {
            return JSON.parse(rawStr) as T;
          } catch {
            return rawStr as unknown as T;
          }
        } catch {
          return null;
        }
      },
    };
  }

  return null;
}

export const redisRest: UnifiedRedisClient | null = createUnifiedClient();

export async function getTcpRedis(): Promise<RedisTcp | null> {
  return getOrCreateTcpClient();
}

