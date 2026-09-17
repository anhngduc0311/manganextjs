import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private bucket: string;
  private publicDomain: string;

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.get<string>("R2_ACCOUNT_ID");
    const accessKeyId = this.config.get<string>("R2_ACCESS_KEY_ID");
    const secretAccessKey = this.config.get<string>("R2_SECRET_ACCESS_KEY");
    this.bucket = this.config.get<string>("R2_BUCKET_NAME") || "truyenkomi";
    this.publicDomain = this.config.get<string>("R2_PUBLIC_DOMAIN") || "https://img.truyenkomi.local";

    if (accountId && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.logger.log("Cloudflare R2 storage configured successfully");
    }
  }

  publicUrl(key: string): string {
    return `${this.publicDomain}/${key}`;
  }

  buildKey(prefix: string, originalName: string): string {
    const ext = originalName.includes(".") ? originalName.split(".").pop()!.toLowerCase() : "webp";
    return `${prefix}/${randomUUID()}.${ext}`;
  }

  async getPresignedPutUrl(filename: string, contentType: string) {
    const key = this.buildKey("uploads", filename);
    if (!this.s3Client) {
      return {
        key,
        uploadUrl: `http://localhost:3001/api/upload/mock`,
        publicUrl: `/uploads/${filename}`,
      };
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 600 });
    return {
      key,
      uploadUrl,
      publicUrl: this.publicUrl(key),
    };
  }

  async uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<string> {
    if (!this.s3Client) {
      return `/uploads/${key}`;
    }

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return this.publicUrl(key);
  }
}
