# 📖 TruyenKomi — Nền Tảng Đọc & Quản Lý Truyện Tranh Trực Tuyến

TruyenKomi là nền tảng đọc và quản lý truyện tranh trực tuyến hiện đại, tối ưu trải nghiệm người dùng với tốc độ tải trang cực nhanh, hỗ trợ đọc Offline qua PWA (IndexedDB), quản lý danh mục toàn diện, hệ thống tương tác độc giả (bình luận spoiler blur, đánh giá 5 sao nhận EXP, theo dõi truyện, lịch sử đọc), bảng điều khiển quản trị (Admin Panel) và pipeline thu thập/xử lý ảnh tự động (BullMQ + Sharp + Cloudflare R2).

---

## 🚀 Công Nghệ & Kiến Trúc (100% Serverless Cloud)

- **Framework:** Next.js 15+ (App Router, Server Actions, React 19, TypeScript).
- **Database:** PostgreSQL on **Neon** (kết nối qua Connection Pooler + Prisma ORM). Tìm kiếm không dấu & mờ cực nhanh với `pg_trgm` + `unaccent`.
- **Cache & Message Broker:** **Upstash Redis** (REST client cho Next.js serverless/Edge + TCP ioredis cho BullMQ Worker).
- **Storage CDN:** **Cloudflare R2** (S3-compatible API với Presigned URL upload trực tiếp từ trình duyệt).
- **Security & Auth:** NextAuth v5 + JWT (HttpOnly, Secure cookies) + Password Hashing bằng Argon2id (`@node-rs/argon2`).
- **Reader Engine:** Hỗ trợ 3 chế độ đọc: *Dọc vô tận (Webtoon)*, *Từng trang (Single Page)*, *2 trang (Double Page)* kèm bàn phím & full-screen navigation.
- **PWA & Offline:** Service Worker cache assets + IndexedDB lưu trữ toàn bộ ảnh chương để đọc khi mất mạng.
- **Realtime Presence:** Server-Sent Events (SSE) theo dõi số lượng độc giả đang đọc trực tiếp từng chương truyện theo thời gian thực.
- **Background Pipeline:** Worker tách biệt (`tsx workers/index.ts`) xử lý nén ảnh WebP (Sharp) và đồng bộ view batch mỗi 30s.

---

## 🛠️ Cài Đặt & Khởi Chạy (Local Development)

### 1. Yêu Cầu Môi Trường
- **Node.js:** `>= 20.0.0`
- **npm:** `>= 10.0.0`

### 2. Cấu Hình Biến Môi Trường (`.env`)
Tạo tệp `.env` tại thư mục gốc với các thông số:

```env
# Neon PostgreSQL
DATABASE_URL="postgresql://neondb_owner:password@ep-delicate-pooler.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:password@ep-delicate.aws.neon.tech/neondb?sslmode=require"

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

# Nạp 5 truyện mẫu, thể loại và tài khoản Admin mặc định
npm run db:seed
```

### 5. Khởi Chạy Web Server & Background Worker
Chạy web app:
```bash
npm run dev
```
Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

Chạy worker xử lý nén ảnh & gom batch view (ở terminal riêng):
```bash
npm run worker
```

---

## 🔑 Tài Khoản Mặc Định (Sau Khi Seed)

| Vai Trò | Email | Mật Khẩu | Quyền Hạn |
| :--- | :--- | :--- | :--- |
| **Quản Trị Viên (Admin)** | `admin@truyenkomi.local` | `Admin@123456` | Truy cập `/admin`, Quản lý truyện, chương, thể loại, user, comment, report |
| **Độc Giả Mẫu (Reader)** | `reader@truyenkomi.local` | `User@123456` | Đọc truyện, bình luận, đánh giá sao, theo dõi, tải offline |

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
