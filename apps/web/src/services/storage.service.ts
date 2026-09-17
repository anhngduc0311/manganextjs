import { HeadBucketCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { r2Bucket, r2Client, r2PublicDomain } from "@/lib/s3";

export const storageService = {
  publicUrl(key: string): string {
    return `${r2PublicDomain}/${key}`;
  },

  buildKey(prefix: string, originalName: string): string {
    const ext = originalName.includes(".") ? originalName.split(".").pop()!.toLowerCase() : "jpg";
    return `${prefix}/${randomUUID()}.${ext}`;
  },

  async getPresignedPutUrl(key: string, contentType: string, expiresInSeconds = 600): Promise<string> {
    if (!r2Client) throw new Error("R2 chua duoc cau hinh (kiem tra R2_* trong .env)");
    return getSignedUrl(
      r2Client,
      new PutObjectCommand({ Bucket: r2Bucket, Key: key, ContentType: contentType }),
      { expiresIn: expiresInSeconds },
    );
  },

  async uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<string> {
    if (!r2Client) throw new Error("R2 chua duoc cau hinh (kiem tra R2_* trong .env)");
    await r2Client.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return this.publicUrl(key);
  },

  async checkHealth(): Promise<void> {
    if (!r2Client) throw new Error("R2 chua cau hinh");
    await r2Client.send(new HeadBucketCommand({ Bucket: r2Bucket }));
  },
};
