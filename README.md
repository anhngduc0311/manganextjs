# 📖 TruyenKomi — Nền Tảng Đọc & Quản Lý Truyện Tranh Trực Tuyến

TruyenKomi là nền tảng đọc và quản lý truyện tranh trực tuyến hiện đại, tối ưu trải nghiệm người dùng với tốc độ tải trang cực nhanh, hỗ trợ đọc Offline qua PWA (IndexedDB), quản lý danh mục toàn diện, hệ thống tương tác độc giả (bình luận spoiler blur, đánh giá 5 sao nhận EXP, theo dõi truyện, lịch sử đọc), bảng điều khiển quản trị (Admin Panel) và pipeline thu thập/xử lý ảnh tự động (BullMQ + Sharp + Cloudflare R2).

---

## 🚀 Công Nghệ & Kiến Trúc (100% Serverless Cloud)

- **Framework:** Next.js 15+ (App Router, Server Actions, React 19, TypeScript).
- **Database:** PostgreSQL on **Neon** (kết nối qua Connection Pooler + Prisma ORM). Tìm kiếm không dấu & mờ cực nhanh với `pg_trgm` + `unaccent`.
- **Cache & Session:** **Upstash Redis** (REST client cho Next.js serverless/Edge & Invalidation Cache).
- **Storage CDN:** **Cloudflare R2** (S3-compatible API với Presigned URL upload trực tiếp từ trình duyệt).
- **Security & Auth:** NextAuth v5 + JWT (HttpOnly, Secure cookies) + Password Hashing bằng Argon2id (`@node-rs/argon2`).
- **Reader Engine:** Hỗ trợ 3 chế độ đọc: *Dọc vô tận (Webtoon)*, *Từng trang (Single Page)*, *2 trang (Double Page)* kèm bàn phím & full-screen navigation.
- **PWA & Offline:** Service Worker cache assets + IndexedDB lưu trữ toàn bộ ảnh chương để đọc khi mất mạng.
- **Realtime Presence:** Server-Sent Events (SSE) theo dõi số lượng độc giả đang đọc trực tiếp từng chương truyện theo thời gian thực.
- **Direct View Tracking:** Ghi nhận lượt xem trực tiếp và tức thời vào PostgreSQL qua database transaction.

---

## 🛠️ Cài Đặt & Khởi Chạy (Local Development)

### 1. Yêu Cầu Môi Trường
- **Node.js:** `>= 20.0.0`
- **npm:** `>= 10.0.0`

### 2. Cấu Hình Biến Môi Trường (`.env`)
Tạo tệp `.env` tại thư mục gốc với các thông số:

```env
# Neon PostgreSQL
DATABASE_URL="postgresql://neondb_owner:password@ep-delicate-pooler.aws.neon.tech/neondb?sslmode=verify-full"
DIRECT_URL="postgresql://neondb_owner:password@ep-delicate.aws.neon.tech/neondb?sslmode=verify-full"

# NextAuth Secret & App URL
AUTH_SECRET="your-32-character-secret-key-here"
NEXTAUTH_SECRET="your-32-character-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Upstash Redis
UPSTASH_REDIS_REST_URL="https://your-upstash-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
UPSTASH_REDIS_URL_TCP="rediss://default:your-token@your-upstash-redis.upstash.io:6379"

# Cloudflare R2 Object Storage
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="truyenkomi"
R2_PUBLIC_DOMAIN="https://cdn.truyenkomi.com"

# Crawler Ingest Secret
CRAWLER_SECRET_KEY="dev-crawler-secret"
```

### 3. Cài Đặt Thư Viện
```bash
npm install
```

### 4. Đồng Bộ CSDL & Nạp Dữ Liệu Mẫu (Seed Data)
```bash
# Tạo cấu trúc database
npm run db:migrate

# Sinh Prisma client
npm run db:generate

# Nạp tài khoản Admin mặc định
npm run db:seed
```

### 5. Khởi Chạy Web Server
Chạy web app:
```bash
npm run dev
```
Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

### 6. Đồng Bộ / Crawl Truyện Từ MangaDex
1. Quét TOÀN BỘ truyện tiếng Việt từ mới nhất đến cũ nhất:
```bash
npm run crawl:mangadex -- --all
```

2. Quét thử nghiệm số lượng truyện mong muốn (ví dụ 10 truyện):
```bash
npm run crawl:mangadex -- --limit=10
```

3. Tiếp tục quét từ điểm đã dừng trước đó (Resume):
```bash
npm run crawl:mangadex -- --all --resume
```

4. Bỏ qua các chương/truyện đã có trong CSDL (để tăng tốc độ quét):
```bash
npm run crawl:mangadex -- --all --skip-existing
```

---

## 🐳 Triển Khai Nhanh Trên Ubuntu / Linux Bằng Docker (`deploy.sh`)

Dự án đã tích hợp sẵn script tự động hóa triển khai toàn diện (`deploy.sh`) cho Ubuntu:

### 1. Cấp quyền thực thi và triển khai 1-click
```bash
sudo apt update && sudo apt install -y git && sudo apt install nano -y

chmod +x deploy.sh
./deploy.sh
```
> **Script sẽ tự động:**
> - Kiểm tra và hỗ trợ cài đặt Docker & Docker Compose nếu chưa có
> - Khởi tạo tệp cấu hình `.env` với các khóa bảo mật bí mật được sinh ngẫu nhiên an toàn
> - Build các image `web` (Next.js 15), `crawler`, `postgres`, `redis`, `meilisearch`
> - Khởi chạy tất cả container nền (`docker compose up -d`)
> - Đồng bộ cấu trúc cơ sở dữ liệu (`prisma migrate deploy`)
> - Kiểm tra tình trạng sức khỏe hệ thống qua `/api/health`

### 2. Nạp tài khoản Admin & Dữ liệu mẫu (Seed)
```bash
./deploy.sh --seed
```

### 3. Các lệnh quản trị hệ thống:
```bash
# Xem log tất cả các dịch vụ (hoặc riêng từng dịch vụ: web, crawler)
./deploy.sh --logs
./deploy.sh --logs web

# Kiểm tra trạng thái & RAM/CPU sử dụng
./deploy.sh --status

# Khởi động lại hệ thống
./deploy.sh --restart

# Sao lưu cơ sở dữ liệu (Database Backup)
./deploy.sh --backup

# Khôi phục dữ liệu từ bản sao lưu
./deploy.sh --restore ./backups/truyenkomi_backup_xxxx.sql.gz

# Dừng toàn bộ hệ thống
./deploy.sh --down
```

---

## 🔑 Tài Khoản Mặc Định (Sau Khi Seed)

| Vai Trò | Email | Mật Khẩu | Quyền Hạn |
| :--- | :--- | :--- | :--- |
| **Quản Trị Viên (Admin)** | `admin@truyenkomi.local` | `Admin@123456` | Truy cập `/admin`, Quản lý truyện, chương, thể loại, user, comment, report |
| **Độc Giả Mẫu (Reader)** | `reader@truyenkomi.local` | `User@123456` | Đọc truyện, bình luận, đánh giá sao, theo dõi truyện |

---

## 📂 Cấu Trúc Dự Án

```
manganextjs/
├── prisma/
│   ├── schema.prisma            # Database Schema với 12 models & quan hệ
│   └── seed.ts                  # Script nạp dữ liệu mẫu
├── public/
│   ├── manifest.json            # PWA Web App Manifest
│   ├── sw.js                    # Service Worker caching & offline
│   └── icons/                   # PWA Icons
├── src/
│   ├── app/
│   │   ├── (admin)/admin/       # Bảng điều khiển quản trị (RBAC Guard)
│   │   │   ├── comics/          # Quản lý truyện & upload cover
│   │   │   ├── chapters/        # Quản lý danh sách chương & upload trang
│   │   │   ├── genres/          # Quản lý thể loại
│   │   │   ├── comments/        # Kiểm duyệt bình luận
│   │   │   ├── reports/         # Xử lý báo lỗi chương
│   │   │   └── users/           # Phân quyền & quản lý tài khoản
│   │   ├── (auth)/              # Đăng ký & Đăng nhập
│   │   ├── (main)/              # Giao diện độc giả
│   │   │   ├── comics/[slug]/   # Trang chi tiết truyện & danh sách chương
│   │   │   │   └── [chapter]/   # Reader Engine 3 chế độ + SSE Presence
│   │   │   ├── categories/      # Danh mục thể loại
│   │   │   ├── rankings/        # Bảng xếp hạng theo lượt xem / rating
│   │   │   ├── search/          # Tìm kiếm pg_trgm không dấu & bộ lọc
│   │   │   ├── followed/        # Truyện đang theo dõi
│   │   │   ├── history/         # Lịch sử đọc truyện
│   │   │   ├── profile/         # Hồ sơ người dùng & Level EXP
│   │   │   └── offline/         # Tủ truyện ngoại tuyến IndexedDB
│   │   ├── api/
│   │   │   ├── crawler/ingest/  # Ingest API bảo mật cho crawler nạp truyện
│   │   │   ├── realtime/sse/    # SSE streaming live readers presence
│   │   │   ├── upload/          # Presigned PUT URL Cloudflare R2
│   │   │   └── health/          # Health check endpoint (DB, Redis, R2)
│   │   ├── sitemap.ts           # Dynamic Sitemap SEO
│   │   ├── robots.ts            # Dynamic Robots.txt
│   │   ├── not-found.tsx        # 404 UI
│   │   └── error.tsx            # Error boundary
│   ├── components/              # UI Components chuẩn Modular Clean Code
│   ├── services/                # Business logic layer (Auth, Comic, Chapter, Cache, Storage, Gamification...)
│   ├── hooks/                   # Custom React hooks (useOfflineStorage, useLiveReaders, useReaderSettings...)
│   └── lib/                     # Database, Redis, Logger, S3 clients & Text Normalizers
└── workers/
    ├── image-processor.ts       # Sharp WebP converter (1600px, quality 80)
    ├── crawler.worker.ts        # BullMQ Ingestion Worker
    ├── view-sync.worker.ts      # 30s View Buffer Flush to PostgreSQL
    └── index.ts                 # Worker entry point
```

---

## 🧪 Kiểm Thử (Unit & Integration Tests)

Chạy bộ test suite với Vitest:
```bash
npm test
```

Kiểm tra kiểu dữ liệu TypeScript nghiêm ngặt:
```bash
npx tsc --noEmit
```

---

## 🩺 Kiểm Tra Sức Khỏe Hệ Thống (Health Check)

Endpoint kiểm tra trạng thái và độ trễ kết nối:
- `GET /api/health`
- **Kết quả trả về mẫu:**
```json
{
  "status": "ok",
  "timestamp": "2026-09-16T09:47:00.000Z",
  "environment": "development",
  "version": "1.0.0",
  "checks": {
    "db": { "ok": true, "latencyMs": 18 },
    "redis": { "ok": true, "latencyMs": 42 },
    "r2": { "ok": true, "latencyMs": 85 }
  }
}
```

---

## 🤖 API Thu Thập & Nạp Truyện (Crawler Ingest API)

- **Endpoint:** `POST /api/crawler/ingest`
- **Header:** `Authorization: Bearer <CRAWLER_SECRET_KEY>`
- **Body:**
```json
{
  "comic": {
    "title": "Tên Truyện",
    "author": "Tác Giả",
    "status": "ONGOING",
    "categories": ["Hành Động", "Phiêu Lưu"],
    "description": "Tóm tắt truyện...",
    "coverImage": "https://example.com/cover.jpg"
  },
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "Chương 1",
      "pages": [
        "https://example.com/page1.jpg",
        "https://example.com/page2.jpg"
      ]
    }
  ]
}
```

---

## Cập nhật quyền, thống kê chương và EXP

Trước khi chạy phiên bản mới trên database hiện có, chạy `npx prisma migrate deploy`.
Migration `20260916093000_repair_chapter_metadata_and_rewards` tính lại số chương,
khôi phục index trigram và tạo bảng `ReadingReward` để mỗi người chỉ nhận EXP
một lần cho mỗi chương. Không dùng `prisma db push` thay thế: lệnh đó không chạy
phần cập nhật dữ liệu của migration.

Migration giữ nguyên EXP hiện có và đánh dấu chương cuối trong lịch sử là đã thưởng.
Các chương đọc trước đó không còn trong lịch sử không thể được khôi phục chính xác.

`npm test` chạy các unit test. Để chạy kiểm thử PostgreSQL, dùng một database trống
riêng, đặt `READING_TEST_DATABASE_URL`, `DATABASE_URL` và `DIRECT_URL` cùng trỏ tới
database đó, rồi chạy:

```sh
npx vitest run src/lib/__tests__/reading.integration.test.ts
```

Bộ kiểm thử tự tạo schema và dữ liệu mẫu; cần database trống mới cho mỗi lần chạy.

## 📋 Runbook Sự Cố Thường Gặp

1. **Lỗi kết nối Neon Postgres:**
   - Đảm bảo `DATABASE_URL` dùng connection pooler string (port 6543 hoặc domain có `-pooler`).
   - `DIRECT_URL` dùng connection direct string cho `prisma migrate`.
2. **Lỗi BullMQ không nhận Job:**
   - Đảm bảo biến `UPSTASH_REDIS_URL_TCP` đã được khai báo với giao thức `rediss://` và worker `npm run worker` đang chạy.
3. **Upload ảnh lỗi Presigned URL:**
   - Kiểm tra CORS của Cloudflare R2 bucket: Cho phép Origin `*` hoặc domain của ứng dụng với methods `GET`, `PUT`, `HEAD`.

---

© 2026 TruyenKomi. Mã nguồn mở chuẩn Next.js Fullstack.
