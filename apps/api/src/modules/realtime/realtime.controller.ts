import { Controller, Get, Query, Sse } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Observable, interval, map, switchMap, from } from "rxjs";
import { RedisService } from "@/redis/redis.service";
import { randomUUID } from "crypto";

interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

@ApiTags("Realtime")
@Controller("realtime")
export class RealtimeController {
  constructor(private readonly redis: RedisService) {}

  @ApiOperation({ summary: "Server-Sent Events (SSE) theo dõi số người đang đọc cùng một chương" })
  @ApiQuery({ name: "chapterId", required: true, type: String })
  @Sse("sse")
  sse(@Query("chapterId") chapterId: string): Observable<MessageEvent> {
    const clientId = randomUUID();
    const redisKey = `chapter:online:${chapterId || "global"}`;

    return interval(4000).pipe(
      switchMap(() =>
        from(
          (async () => {
            await this.redis.sadd(redisKey, clientId);
            const client = this.redis.getClient();
            let count = 1;
            if (client) {
              await client.expire(redisKey, 30);
              count = Math.max(1, await client.scard(redisKey));
            }
            return { liveCount: count };
          })(),
        ),
      ),
      map((data) => ({ data })),
    );
  }
}
