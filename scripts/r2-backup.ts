/**
 * TruyenKomi - Cloudflare R2 Database Backup & Restore Utility
 *
 * Usage:
 *   npx tsx scripts/r2-backup.ts backup             # Dump PostgreSQL and upload to Cloudflare R2
 *   npx tsx scripts/r2-backup.ts list               # List all database backups in R2 bucket
 *   npx tsx scripts/r2-backup.ts restore <filename> # Download & restore a backup from R2
 *   npx tsx scripts/r2-backup.ts upload <file-path> # Upload a local file to R2
 *   npx tsx scripts/r2-backup.ts download <remote-key> <dest-path>
 */

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import zlib from "zlib";
import dotenv from "dotenv";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";

dotenv.config();

const execAsync = promisify(exec);

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.CF_R2_ACCESS_KEY;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.CF_R2_SECRET_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "comics";
const backupPrefix = "backups/";
const MAX_BACKUPS_TO_KEEP = 30;

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

function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = now.getFullYear();
  const MM = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const HH = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${yyyy}-${MM}-${dd}_${HH}-${mm}-${ss}`;
}

/**
 * Dump PostgreSQL database (locally or from Docker container) and upload to Cloudflare R2
 */
async function backupDatabase() {
  console.log("==========================================================");
  console.log("☁️  TRUYENKOMI - SAO LƯU CƠ SỞ DỮ LIỆU LÊN CLOUDFLARE R2");
  console.log(`📦 Bucket: "${bucketName}" | Thư mục: "${backupPrefix}"`);
  console.log("==========================================================");

  const timestamp = getTimestamp();
  const tempDir = path.join(process.cwd(), "temp_backups");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const sqlFile = path.join(tempDir, `truyenkomi_${timestamp}.sql`);
  const gzFile = `${sqlFile}.gz`;
  const remoteKey = `${backupPrefix}truyenkomi_${timestamp}.sql.gz`;

  const dbUser = process.env.POSTGRES_USER || "postgres";
  const dbPass = process.env.POSTGRES_PASSWORD || "postgres";
  const dbName = process.env.POSTGRES_DB || "truyenkomi";
  const dbHost = process.env.POSTGRES_HOST || "localhost";
  const dbPort = process.env.POSTGRES_PORT || "5432";

  console.log(`\n⏳ [1/4] Đang kết xuất dữ liệu PostgreSQL (${dbName})...`);

  // Detect whether pg_dump is run inside Docker container or locally
  let dumpSuccess = false;

  // Try Docker container first if truyenkomi_postgres exists
  try {
    const isDockerRunning = await execAsync("docker ps --filter name=truyenkomi_postgres --format '{{.Names}}'").catch(() => null);
    if (isDockerRunning && isDockerRunning.stdout.includes("truyenkomi_postgres")) {
      console.log("   (Đang xuất dữ liệu từ Docker container 'truyenkomi_postgres')...");
      await execAsync(`docker exec -t truyenkomi_postgres pg_dump -U ${dbUser} -d ${dbName} > "${sqlFile}"`);
      dumpSuccess = true;
    }
  } catch {
    // Fallback to local pg_dump
  }

  if (!dumpSuccess) {
    try {
      console.log(`   (Đang xuất dữ liệu từ máy chủ ${dbHost}:${dbPort})...`);
      const envPass = process.platform === "win32" ? `set PGPASSWORD=${dbPass}&&` : `PGPASSWORD="${dbPass}"`;
      await execAsync(`${envPass} pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${sqlFile}"`);
      dumpSuccess = true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Không thể chạy pg_dump. Lỗi: ${msg}`);
    }
  }

  const sqlSize = fs.statSync(sqlFile).size;
  console.log(`✅ [1/4] Xuất SQL hoàn tất: ${formatBytes(sqlSize)}`);

  console.log(`\n⏳ [2/4] Đang nén dữ liệu bằng Gzip...`);
  const rawStream = fs.createReadStream(sqlFile);
  const gzipStream = zlib.createGzip({ level: 9 });
  const writeStream = fs.createWriteStream(gzFile);

  await new Promise<void>((resolve, reject) => {
    rawStream.pipe(gzipStream).pipe(writeStream).on("finish", resolve).on("error", reject);
  });

  const gzSize = fs.statSync(gzFile).size;
  const ratio = ((1 - gzSize / (sqlSize || 1)) * 100).toFixed(1);
  console.log(`✅ [2/4] Nén thành công: ${formatBytes(gzSize)} (Giảm ${ratio}% dung lượng)`);

  console.log(`\n⏳ [3/4] Đang tải bản sao lưu lên Cloudflare R2 ("${remoteKey}")...`);
  const client = getClient();
  const gzBuffer = fs.readFileSync(gzFile);

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: remoteKey,
      Body: gzBuffer,
      ContentType: "application/gzip",
      Metadata: {
        createdAt: new Date().toISOString(),
        database: dbName,
        originalSize: String(sqlSize),
      },
    })
  );
  console.log(`✅ [3/4] Tải lên Cloudflare R2 thành công!`);

  // Cleanup local temp files
  try {
    fs.unlinkSync(sqlFile);
    fs.unlinkSync(gzFile);
    fs.rmdirSync(tempDir);
  } catch {}

  console.log(`\n⏳ [4/4] Đang kiểm tra vòng đời bản sao lưu (Giữ tối đa ${MAX_BACKUPS_TO_KEEP} bản gần nhất)...`);
  await cleanOldBackups(client);

  console.log("\n==========================================================");
  console.log(`🎉 HOÀN TẤT SAO LƯU DATABASE: ${remoteKey}`);
  console.log(`📊 Dung lượng trên Cloudflare R2: ${formatBytes(gzSize)}`);
  console.log("==========================================================\n");
}

async function cleanOldBackups(client: S3Client) {
  try {
    const listRes = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: backupPrefix,
      })
    );

    const items = (listRes.Contents || [])
      .filter((item) => item.Key && !item.Key.endsWith("/"))
      .sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0));

    if (items.length > MAX_BACKUPS_TO_KEEP) {
      const toDelete = items.slice(MAX_BACKUPS_TO_KEEP);
      for (const item of toDelete) {
        if (item.Key) {
          await client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: item.Key,
            })
          );
          console.log(`   🗑️ Đã xóa bản sao lưu cũ: ${item.Key}`);
        }
      }
    }
  } catch {
    // Non-blocking cleanup
  }
}

/**
 * List all database backups in Cloudflare R2 bucket
 */
async function listBackups() {
  const client = getClient();
  console.log(`\n📂 Danh sách các bản sao lưu trong Cloudflare R2 (Bucket: "${bucketName}", Thư mục: "${backupPrefix}"):`);

  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: backupPrefix,
    })
  );

  const items = (response.Contents || [])
    .filter((item) => item.Key && !item.Key.endsWith("/"))
    .sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0));

  if (items.length === 0) {
    console.log("   (Chưa có bản sao lưu nào trong thư mục backups/)");
    return;
  }

  console.log("--------------------------------------------------------------------------------------------------");
  console.log(String("STT").padEnd(5) + String("Tên tệp (Remote Key)").padEnd(55) + String("Dung lượng").padEnd(15) + "Thời gian tạo");
  console.log("--------------------------------------------------------------------------------------------------");

  items.forEach((item, index) => {
    const stt = String(index + 1).padEnd(5);
    const key = (item.Key || "").padEnd(55);
    const size = formatBytes(item.Size || 0).padEnd(15);
    const date = item.LastModified ? item.LastModified.toLocaleString("vi-VN") : "N/A";
    console.log(stt + key + size + date);
  });
  console.log("--------------------------------------------------------------------------------------------------\n");
}

/**
 * Download a backup from Cloudflare R2 and restore into PostgreSQL
 */
async function restoreDatabase(remoteKeyOrName: string) {
  const client = getClient();
  const remoteKey = remoteKeyOrName.startsWith(backupPrefix) ? remoteKeyOrName : `${backupPrefix}${remoteKeyOrName}`;

  console.log("==========================================================");
  console.log(`🔄 KHÔI PHỤC CƠ SỞ DỮ LIỆU TỪ CLOUDFLARE R2`);
  console.log(`📦 Tệp nguồn: "${remoteKey}"`);
  console.log("==========================================================");

  const tempDir = path.join(process.cwd(), "temp_backups");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const gzPath = path.join(tempDir, path.basename(remoteKey));
  const sqlPath = gzPath.replace(/\.gz$/i, "");

  console.log(`\n⏳ [1/3] Đang tải tệp sao lưu từ Cloudflare R2 về máy chủ...`);
  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: remoteKey,
    })
  );

  if (!response.Body) {
    throw new Error(`Không tìm thấy dữ liệu tệp ${remoteKey} trên Cloudflare R2.`);
  }

  const stream = response.Body as Readable;
  const fileStream = fs.createWriteStream(gzPath);
  await new Promise<void>((resolve, reject) => {
    stream.pipe(fileStream).on("finish", resolve).on("error", reject);
  });
  console.log(`✅ [1/3] Đã tải về: ${formatBytes(fs.statSync(gzPath).size)}`);

  console.log(`\n⏳ [2/3] Đang giải nén dữ liệu...`);
  const gzReadStream = fs.createReadStream(gzPath);
  const gunzipStream = zlib.createGunzip();
  const sqlWriteStream = fs.createWriteStream(sqlPath);
  await new Promise<void>((resolve, reject) => {
    gzReadStream.pipe(gunzipStream).pipe(sqlWriteStream).on("finish", resolve).on("error", reject);
  });
  console.log(`✅ [2/3] Giải nén SQL thành công (${formatBytes(fs.statSync(sqlPath).size)})`);

  console.log(`\n⏳ [3/3] Đang nạp dữ liệu vào PostgreSQL...`);
  const dbUser = process.env.POSTGRES_USER || "postgres";
  const dbPass = process.env.POSTGRES_PASSWORD || "postgres";
  const dbName = process.env.POSTGRES_DB || "truyenkomi";
  const dbHost = process.env.POSTGRES_HOST || "localhost";
  const dbPort = process.env.POSTGRES_PORT || "5432";

  let restoreSuccess = false;

  // Try docker container first
  try {
    const isDockerRunning = await execAsync("docker ps --filter name=truyenkomi_postgres --format '{{.Names}}'").catch(() => null);
    if (isDockerRunning && isDockerRunning.stdout.includes("truyenkomi_postgres")) {
      console.log("   (Đang nạp vào Docker container 'truyenkomi_postgres')...");
      await execAsync(`docker exec -i truyenkomi_postgres psql -U ${dbUser} -d ${dbName} < "${sqlPath}"`);
      restoreSuccess = true;
    }
  } catch {}

  if (!restoreSuccess) {
    const envPass = process.platform === "win32" ? `set PGPASSWORD=${dbPass}&&` : `PGPASSWORD="${dbPass}"`;
    await execAsync(`${envPass} psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${sqlPath}"`);
  }

  // Cleanup
  try {
    fs.unlinkSync(gzPath);
    fs.unlinkSync(sqlPath);
    fs.rmdirSync(tempDir);
  } catch {}

  console.log("\n==========================================================");
  console.log(`🎉 KHÔI PHỤC DỮ LIỆU THÀNH CÔNG VÀO DATABASE "${dbName}"!`);
  console.log("==========================================================\n");
}

async function uploadFile(localPath: string) {
  if (!fs.existsSync(localPath)) throw new Error(`Tệp không tồn tại: ${localPath}`);
  const client = getClient();
  const fileName = path.basename(localPath);
  const remoteKey = `${backupPrefix}${fileName}`;
  const fileBuffer = fs.readFileSync(localPath);

  console.log(`☁️ Đang tải lên R2: ${remoteKey}...`);
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: remoteKey,
      Body: fileBuffer,
      ContentType: localPath.endsWith(".gz") ? "application/gzip" : "application/sql",
    })
  );
  console.log(`✅ Tải lên thành công: ${remoteKey}`);
}

async function downloadFile(remoteKeyOrName: string, destPath: string) {
  const client = getClient();
  const remoteKey = remoteKeyOrName.startsWith(backupPrefix) ? remoteKeyOrName : `${backupPrefix}${remoteKeyOrName}`;
  console.log(`📥 Đang tải từ R2 ("${remoteKey}") về "${destPath}"...`);

  const response = await client.send(new GetObjectCommand({ Bucket: bucketName, Key: remoteKey }));
  if (!response.Body) throw new Error(`Không tìm thấy tệp ${remoteKey}`);

  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const stream = response.Body as Readable;
  const fileStream = fs.createWriteStream(destPath);
  await new Promise<void>((resolve, reject) => {
    stream.pipe(fileStream).on("finish", resolve).on("error", reject);
  });
  console.log(`✅ Tải thành công: ${destPath}`);
}

async function main() {
  const [command, arg1, arg2] = process.argv.slice(2);

  try {
    if (command === "backup" || command === "dump") {
      await backupDatabase();
    } else if (command === "list" || command === "ls") {
      await listBackups();
    } else if (command === "restore") {
      if (!arg1) {
        console.error("❌ Vui lòng chỉ định tên tệp sao lưu: npx tsx scripts/r2-backup.ts restore <filename>");
        console.log("   (Xem danh sách tệp qua: npx tsx scripts/r2-backup.ts list)");
        process.exit(1);
      }
      await restoreDatabase(arg1);
    } else if (command === "upload") {
      if (!arg1) {
        console.error("❌ Vui lòng chỉ định đường dẫn tệp: npx tsx scripts/r2-backup.ts upload <local-file>");
        process.exit(1);
      }
      await uploadFile(arg1);
    } else if (command === "download") {
      if (!arg1 || !arg2) {
        console.error("❌ Sử dụng: npx tsx scripts/r2-backup.ts download <remote-key> <dest-path>");
        process.exit(1);
      }
      await downloadFile(arg1, arg2);
    } else {
      console.log("Sử dụng:");
      console.log("  npx tsx scripts/r2-backup.ts backup              # Sao lưu DB lên Cloudflare R2");
      console.log("  npx tsx scripts/r2-backup.ts list                # Liệt kê các bản sao lưu");
      console.log("  npx tsx scripts/r2-backup.ts restore <filename>  # Khôi phục DB từ Cloudflare R2");
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ [R2 Backup Error]: ${msg}`);
    process.exit(1);
  }
}

main();
