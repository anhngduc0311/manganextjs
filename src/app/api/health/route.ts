import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redisRest } from "@/lib/redis";
import { meiliService } from "@/lib/meilisearch";
import { storageService } from "@/services/storage.service";

export const dynamic = "force-dynamic";

interface HealthCheckResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const checks: {
    db: HealthCheckResult;
    redis: HealthCheckResult;
    meilisearch: HealthCheckResult;
    r2: HealthCheckResult;
  } = {
    db: { ok: false, latencyMs: -1 },
    redis: { ok: false, latencyMs: -1 },
    meilisearch: { ok: false, latencyMs: -1 },
    r2: { ok: false, latencyMs: -1 },
  };

  // 1. Database Check
  try {
    const start = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.db = {
      ok: true,
      latencyMs: Math.round(performance.now() - start),
    };
  } catch (err) {
    checks.db = {
      ok: false,
      latencyMs: -1,
      error: (err instanceof Error ? err.message : "DB connection error"),
    };
  }

  // 2. Redis Check
  try {
    const start = performance.now();
    if (redisRest) {
      await redisRest.ping();
      checks.redis = {
        ok: true,
        latencyMs: Math.round(performance.now() - start),
      };
    } else {
      checks.redis = {
        ok: false,
        latencyMs: -1,
        error: "Redis client not configured",
      };
    }
  } catch (err) {
    checks.redis = {
      ok: false,
      latencyMs: -1,
      error: (err instanceof Error ? err.message : "Redis ping error"),
    };
  }

  // 3. Meilisearch Check
  try {
    const start = performance.now();
    const isMeiliOk = await meiliService.health();
    checks.meilisearch = {
      ok: isMeiliOk,
      latencyMs: Math.round(performance.now() - start),
      error: isMeiliOk ? undefined : "Meilisearch not available",
    };
  } catch (err) {
    checks.meilisearch = {
      ok: false,
      latencyMs: -1,
      error: (err instanceof Error ? err.message : "Meilisearch connection error"),
    };
  }

  // 4. Storage (R2) Check
  try {
    const start = performance.now();
    await storageService.checkHealth();
    checks.r2 = {
      ok: true,
      latencyMs: Math.round(performance.now() - start),
    };
  } catch (err) {
    checks.r2 = {
      ok: false,
      latencyMs: -1,
      error: (err instanceof Error ? err.message : "R2 health check error"),
    };
  }

  const allOk = checks.db.ok && checks.redis.ok;
  const anyOk = checks.db.ok || checks.redis.ok || checks.meilisearch.ok || checks.r2.ok;
  const status = allOk ? "ok" : anyOk ? "degraded" : "error";

  return NextResponse.json(
    {
      status,
      timestamp,
      environment: process.env.NODE_ENV,
      version: "1.0.0",
      checks,
    },
    {
      status: allOk ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
