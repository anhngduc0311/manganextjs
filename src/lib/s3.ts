import { S3Client } from "@aws-sdk/client-s3";
import { env, hasR2 } from "@/lib/env";

const globalForS3 = globalThis as unknown as { r2Client?: S3Client };

export const r2Client: S3Client | null = hasR2
  ? (globalForS3.r2Client ??=
      new S3Client({
        region: "auto",
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID!,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
        },
      }))
  : null;

export const r2Bucket = env.R2_BUCKET_NAME ?? "truyenkomi-comics";
export const r2PublicDomain = (env.R2_PUBLIC_DOMAIN ?? "https://cdn.truyenkomi.com").replace(/\/$/, "");
