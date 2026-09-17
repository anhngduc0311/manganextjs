import { z } from "zod";

const optionalUrl = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v))
  .pipe(z.string().url().optional());

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  REDIS_URL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  UPSTASH_REDIS_URL_TCP: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_DOMAIN: optionalUrl,
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: optionalUrl,
  AUTH_SECRET: z.string().min(1).optional(),
  AUTH_URL: optionalUrl,
  MEILISEARCH_HOST: optionalUrl,
  MEILISEARCH_MASTER_KEY: z.string().optional(),
  CRAWLER_SECRET_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

function parseEnv() {
  const isTest = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
  const envToParse = {
    ...process.env,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || process.env.CF_R2_ACCESS_KEY,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || process.env.CF_R2_SECRET_KEY,
    DATABASE_URL:
      process.env.DATABASE_URL ||
      (isTest ? "postgresql://postgres:postgres@localhost:5433/test" : "postgresql://postgres:postgres@localhost:5432/truyenkomi"),
    DIRECT_URL:
      process.env.DIRECT_URL ||
      (isTest ? "postgresql://postgres:postgres@localhost:5433/test" : "postgresql://postgres:postgres@localhost:5432/truyenkomi"),
  };

  const parsed = envSchema.safeParse(envToParse);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`[env] Cau hinh moi truong khong hop le: ${missing}`);
  }
  return parsed.data;
}

export const env = parseEnv();

export const hasRedis = Boolean(
  (env.REDIS_URL && env.REDIS_URL.length > 0) ||
  (env.UPSTASH_REDIS_URL_TCP && env.UPSTASH_REDIS_URL_TCP.length > 0) ||
  (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
);

export const hasRedisTcp = Boolean(
  (env.REDIS_URL && env.REDIS_URL.length > 0) ||
  (env.UPSTASH_REDIS_URL_TCP && env.UPSTASH_REDIS_URL_TCP.length > 0)
);

export const hasR2 = Boolean(
  env.R2_ACCOUNT_ID &&
  env.R2_ACCESS_KEY_ID &&
  env.R2_SECRET_ACCESS_KEY &&
  env.R2_BUCKET_NAME
);

export const hasMeilisearch = Boolean(env.MEILISEARCH_HOST);

export const authSecret = env.AUTH_SECRET ?? env.NEXTAUTH_SECRET ?? "truyenkomi-dev-secret";
export const appUrl = env.NEXTAUTH_URL ?? env.AUTH_URL ?? "http://localhost:3000";



