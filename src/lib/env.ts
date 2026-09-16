import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  UPSTASH_REDIS_URL_TCP: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_DOMAIN: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  AUTH_URL: z.string().url().optional(),
  CRAWLER_SECRET_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

function parseEnv() {
  const isTest = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
  const envToParse = {
    ...process.env,
    DATABASE_URL:
      process.env.DATABASE_URL ||
      (isTest ? "postgresql://postgres:postgres@localhost:5432/test" : undefined),
    DIRECT_URL:
      process.env.DIRECT_URL ||
      (isTest ? "postgresql://postgres:postgres@localhost:5432/test" : undefined),
  };

  const parsed = envSchema.safeParse(envToParse);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`[env] Cau hinh moi truong khong hop le: ${missing}`);
  }
  return parsed.data;
}

export const env = parseEnv();

export const hasRedis = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
export const hasRedisTcp = Boolean(env.UPSTASH_REDIS_URL_TCP && env.UPSTASH_REDIS_URL_TCP.length > 0);
export const hasR2 = Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME);
export const authSecret = env.AUTH_SECRET ?? env.NEXTAUTH_SECRET ?? "truyenkomi-dev-secret";
export const appUrl = env.NEXTAUTH_URL ?? env.AUTH_URL ?? "http://localhost:3000";
