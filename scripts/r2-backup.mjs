/**
 * Cloudflare R2 Database Backup & Restore Utility (Pure Node.js ESM)
 * No tsx / typescript runtime required. Runs directly with `node scripts/r2-backup.mjs`
 *
 * Usage:
 *   node scripts/r2-backup.mjs upload <local-file-path>
 *   node scripts/r2-backup.mjs list
 *   node scripts/r2-backup.mjs download <remote-key-or-filename> <local-destination-path>
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";

// Parse .env file natively if not loaded
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const accountId = process.env.R2_ACCOUNT_ID || process.env.CF_R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.CF_R2_ACCESS_KEY;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.CF_R2_SECRET_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "comics";

function getClient() {
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

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function uploadBackup(localPath) {
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

async function downloadBackup(remoteKeyOrName, destPath) {
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

  const stream = response.Body;
  const fileStream = fs.createWriteStream(destPath);

  await new Promise((resolve, reject) => {
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
        console.error("❌ Vui lòng chỉ định đường dẫn tệp sao lưu: node scripts/r2-backup.mjs upload <local-file>");
        process.exit(1);
      }
      await uploadBackup(arg1);
    } else if (command === "list") {
      await listBackups();
    } else if (command === "download") {
      if (!arg1 || !arg2) {
        console.error("❌ Sử dụng: node scripts/r2-backup.mjs download <remote-key-or-filename> <destination-path>");
        process.exit(1);
      }
      await downloadBackup(arg1, arg2);
    } else {
      console.log("Sử dụng:");
      console.log("  node scripts/r2-backup.mjs upload <local-file-path>");
      console.log("  node scripts/r2-backup.mjs list");
      console.log("  node scripts/r2-backup.mjs download <remote-key> <destination-path>");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ [R2 Backup Error]: ${msg}`);
    process.exit(1);
  }
}

main();
