import { Ratelimit } from "@upstash/ratelimit";
import { redisRest } from "@/lib/redis";

type Duration = Parameters<typeof Ratelimit.slidingWindow>[1];

function makeLimiter(requests: number, window: Duration, prefix: string) {
  if (!redisRest) return null;
  return new Ratelimit({
    redis: redisRest,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `rl:${prefix}`,
  });
}

export const authLimiter = makeLimiter(5, "1 m", "auth");
export const writeLimiter = makeLimiter(15, "1 m", "write");


export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{ success: true } | { success: false; retryAfter: number }> {
  if (!limiter) return { success: true };
  try {
    const result = await limiter.limit(identifier);
    if (result.success) return { success: true };
    return { success: false, retryAfter: Math.ceil((result.reset - Date.now()) / 1000) };
  } catch {
    return { success: true };
  }
}
