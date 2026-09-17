import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @ApiOperation({ summary: "Kiểm tra tình trạng hoạt động của API, PostgreSQL và Redis" })
  @Get()
  async getHealth(@Res() res: Response) {
    const timestamp = new Date().toISOString();
    const checks: any = {
      db: { ok: false, latencyMs: -1 },
      redis: { ok: false, latencyMs: -1 },
    };

    // 1. DB
    try {
      const start = performance.now();
      await this.prisma.$queryRaw`SELECT 1`;
      checks.db = {
        ok: true,
        latencyMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      checks.db = {
        ok: false,
        latencyMs: -1,
        error: (err as Error).message,
      };
    }

    // 2. Redis
    try {
      const start = performance.now();
      const client = this.redis.getClient();
      if (client) {
        await client.ping();
        checks.redis = {
          ok: true,
          latencyMs: Math.round(performance.now() - start),
        };
      } else {
        checks.redis = {
          ok: true,
          latencyMs: 0,
          info: "Using in-memory fallback",
        };
      }
    } catch (err) {
      checks.redis = {
        ok: false,
        latencyMs: -1,
        error: (err as Error).message,
      };
    }

    const allOk = checks.db.ok && checks.redis.ok;
    const status = allOk ? "ok" : "degraded";

    return res.status(allOk ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
      status,
      timestamp,
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      checks,
    });
  }
}
