import { Redis } from "@upstash/redis";
import { env, hasRedis } from "@/lib/env";

export const redisRest: Redis | null = hasRedis
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

let tcpRedis: import("ioredis").default | null = null;

export async function getTcpRedis() {
  if (tcpRedis) return tcpRedis;
  const { env: e, hasRedisTcp } = await import("@/lib/env");
  if (!hasRedisTcp) return null;
  const RedisTcp = (await import("ioredis")).default;
  tcpRedis = new RedisTcp(e.UPSTASH_REDIS_URL_TCP!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
  return tcpRedis;
}
