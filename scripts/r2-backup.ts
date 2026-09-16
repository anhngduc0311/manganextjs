/**
 * Cloudflare R2 Database Backup & Restore Utility
 *
 * Usage:
 *   npx tsx scripts/r2-backup.ts upload <local-file-path>
 *   npx tsx scripts/r2-backup.ts list
 *   npx tsx scripts/r2-backup.ts download <remote-key-or-filename> <local-destination-path>
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

dotenv.config();

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.CF_R2_ACCESS_KEY;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.CF_R2_SECRET_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "comics";

import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";

function getClient(): S3Client {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Cloudflare R2 chưa được cấu hình đầy đủ trong .env (Thiếu R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, hoặc R2_SECRET_ACCESS_KEY)."
    );
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
    requestHandler: new NodeHttpHandler({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
        servername: "r2.cloudflarestorage.com",
      }),
    }),
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function uploadBackup(localPath: string) {
  if (!fs.existsSync(localPath)) {
    throw new Error(`Tệp sao lưu không tồn tại: ${localPath}`);
  }

  const client = getClient();
  const fileName = path.basename(localPath);
  const remoteKey = `backups/${fileName}`;
  const fileBuffer = fs.readFileSync(localPath);
  const fileSize = fs.statSync(localPath).size;

  console.log(`☁️  Đang tải bản sao lưu lên Cloudflare R2 (Bucket: "${bucketName}", Key: "${remoteKey}", Kích thước: ${formatBytes(fileSize)})...`);

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: remoteKey,
      Body: fileBuffer,
      ContentType: localPath.endsWith(".gz") ? "application/gzip" : "application/sql",
    })
  );

  console.log(`✅ Đã tải bản sao lưu lên Cloudflare R2 thành công: ${remoteKey}`);
}

async function listBackups() {
  const client = getClient();
  console.log(`📂 Danh sách các bản sao lưu trong Cloudflare R2 (Bucket: "${bucketName}", Prefix: "backups/"):`);

  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "backups/",
    })
  );

  const items = (response.Contents || []).filter((item) => item.Key && !item.Key.endsWith("/"));

  if (items.length === 0) {
    console.log("   (Chưa có bản sao lưu nào trong thư mục backups/)");
    return;
  }

  console.log("-----------------------------------------------------------------------------------------");
  console.log(String("Tên tệp (Remote Key)").padEnd(50) + String("Kích thước").padEnd(15) + "Thời gian tạo");
  console.log("-----------------------------------------------------------------------------------------");

  for (const item of items) {
    const key = item.Key || "";
    const size = formatBytes(item.Size || 0);
    const date = item.LastModified ? item.LastModified.toLocaleString("vi-VN") : "N/A";
    console.log(key.padEnd(50) + size.padEnd(15) + date);
  }
  console.log("-----------------------------------------------------------------------------------------");
}

async function downloadBackup(remoteKeyOrName: string, destPath: string) {
  const client = getClient();
  const remoteKey = remoteKeyOrName.startsWith("backups/") ? remoteKeyOrName : `backups/${remoteKeyOrName}`;

  console.log(`📥 Đang tải bản sao lưu từ Cloudflare R2 ("${remoteKey}") về "${destPath}"...`);

  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: remoteKey,
    })
  );

  if (!response.Body) {
    throw new Error(`Không tìm thấy dữ liệu tệp ${remoteKey}`);
  }

  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const stream = response.Body as Readable;
  const fileStream = fs.createWriteStream(destPath);

  await new Promise<void>((resolve, reject) => {
    stream.pipe(fileStream);
    stream.on("error", reject);
    fileStream.on("finish", resolve);
  });

  const fileSize = fs.statSync(destPath).size;
  console.log(`✅ Tải bản sao lưu thành công: ${destPath} (${formatBytes(fileSize)})`);
}

async function main() {
  const [command, arg1, arg2] = process.argv.slice(2);

  try {
    if (command === "upload") {
      if (!arg1) {
        console.error("❌ Vui lòng chỉ định đường dẫn tệp sao lưu: npx tsx scripts/r2-backup.ts upload <local-file>");
        process.exit(1);
      }
      await uploadBackup(arg1);
    } else if (command === "list") {
      await listBackups();
    } else if (command === "download") {
      if (!arg1 || !arg2) {
        console.error("❌ Sử dụng: npx tsx scripts/r2-backup.ts download <remote-key-or-filename> <destination-path>");
        process.exit(1);
      }
      await downloadBackup(arg1, arg2);
    } else {
      console.log("Sử dụng:");
      console.log("  npx tsx scripts/r2-backup.ts upload <local-file-path>");
      console.log("  npx tsx scripts/r2-backup.ts list");
      console.log("  npx tsx scripts/r2-backup.ts download <remote-key> <destination-path>");
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ [R2 Backup Error]: ${msg}`);
    process.exit(1);
  }
}

main();
