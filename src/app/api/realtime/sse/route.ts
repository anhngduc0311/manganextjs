import { NextRequest } from "next/server";
import { redisRest } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chapterId = searchParams.get("chapterId");

  if (!chapterId) {
    return new Response("Thiếu tham số chapterId", { status: 400 });
  }

  const clientId = Math.random().toString(36).substring(2, 9);
  const redisKey = `chapter:online:${chapterId}`;

  // Helper to update Redis active set
  const pingRedis = async () => {
    if (redisRest) {
      try {
        await redisRest.sadd(redisKey, clientId);
        await redisRest.expire(redisKey, 30);
      } catch {
        // Fallback silently if Redis error
      }
    }
  };

  const getCount = async (): Promise<number> => {
    if (redisRest) {
      try {
        const count = await redisRest.scard(redisKey);
        return Math.max(1, count || 1);
      } catch {
        return 1;
      }
    }
    return 1;
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Initial ping & count
      await pingRedis();
      const initialCount = await getCount();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ liveCount: initialCount })}\n\n`)
      );

      // Heartbeat interval every 4 seconds
      const interval = setInterval(async () => {
        try {
          await pingRedis();
          const count = await getCount();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ liveCount: count })}\n\n`)
          );
        } catch {
          clearInterval(interval);
        }
      }, 4000);

      // Cleanup when connection closes
      req.signal.addEventListener("abort", async () => {
        clearInterval(interval);
        if (redisRest) {
          try {
            await redisRest.srem(redisKey, clientId);
          } catch {}
        }
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
