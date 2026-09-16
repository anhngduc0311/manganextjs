# 📋 SPEC.md — TruyenKomi (Next.js Fullstack Manga Platform)

> **Spec ID:** TK-SPEC-001
> **Ngày tạo:** 2026-09-16
> **Nguồn tham chiếu:** `architecture_nextjs.md` (Kiến trúc hệ thống TruyenKomi)
> **Trạng thái:** Draft — Chờ phê duyệt
> **Cấu trúc tài liệu:** IDEA ➔ Requirements ➔ Design ➔ Tasks

---

# 1️⃣ IDEA (Ý TƯỞNG)

## 1.1. Tuyên bố vấn đề (Problem Statement)

Người đọc truyện tranh tiếng Việt hiện phải đối mặt với:

- **Trang đọc chậm, nặng quảng cáo:** Các site truyện truyền thống tải chậm do không tối ưu ảnh, không CDN edge, không caching phân tán.
- **Không có trải nghiệm đọc offline:** Mất mạng là mất khả năng đọc, kể cả những chương đã mở qua.
- **Trải nghiệm đọc kém cá nhân hóa:** Thiếu chế độ đọc dọc Webtoon / lật trang / Double RTL, thiếu Eye-Care (Sepia, AMOLED).
- **Quản trị nội dung thủ công:** Việc thêm truyện, chương, tối ưu ảnh phải làm tay, không có pipeline tự động.
- **Điểm nghẽn Database khi traffic cao:** Mỗi lượt đọc ghi thẳng vào DB khiến hệ thống nghẽn I/O khi có hàng nghìn độc giả đồng thời.

## 1.2. Giải pháp đề xuất (Proposed Solution)

Xây dựng **TruyenKomi** — nền tảng đọc & quản lý truyện tranh trực tuyến trên **kiến trúc Next.js Fullstack thống nhất (Unified Fullstack Architecture)**:

1. **Một codebase duy nhất** cho cả Frontend lẫn Backend (RSC + Server Actions + Route Handlers) — giảm 50% chi phí duy trì so với mô hình tách FE/BE riêng biệt.
2. **Hiệu năng gần tức thì:** RSC/ISR cho trang tĩnh hóa + Redis multi-tier caching (TTFB mục tiêu < 100ms).
3. **Ứng dụng đọc hạng nặng:** 3 chế độ đọc (Webtoon / Single Page Flip / Double RTL), 4 chế độ màu Eye-Care, phím tắt đầy đủ.
4. **PWA + IndexedDB:** Tải từng chương/truyện để đọc offline hoàn toàn.
5. **Pipeline cào truyện tự động:** Crawler + BullMQ Worker + Sharp tối ưu ảnh Webp → upload Cloudflare R2, không chạm vào tiến trình web chính.
6. **Batch View Buffering:** Lượt xem ghi vào Redis, đồng bộ về DB theo chu kỳ 30 giây bằng 1 câu SQL duy nhất — triệt tiêu nghẽn cổ chai ghi.

## 1.3. Đối tượng người dùng (Target Users)

| Persona | Mô tả | Nhu cầu chính |
| :--- | :--- | :--- |
| **Độc giả (Reader)** | Người đọc truyện trên web/mobile | Đọc nhanh, tìm kiếm tiếng Việt không dấu, theo dõi truyện, lịch sử đọc, đọc offline |
| **Thành viên tích cực** | Người dùng có tài khoản, tương tác cao | Bình luận, đánh giá, hệ thống EXP/Level, Daily Streak, thông báo |
| **Moderator** | Người kiểm duyệt nội dung | Duyệt/xóa bình luận, xử lý báo lỗi chương, quản lý truyện |
| **Admin** | Quản trị hệ thống | Dashboard thống kê, CRUD truyện/chapter/thể loại, phân quyền user |
| **Crawler Engine (hệ thống)** | Dịch vụ cào truyện bên ngoài | Đẩy metadata + ảnh đã tối ưu qua Ingestion API bảo mật |

## 1.4. Giá trị cốt lõi & Mục tiêu kinh doanh (Value Proposition)

- **Tốc độ:** Trang chi tiết truyện & bộ đọc được serve từ cache/ISR trong < 100ms; tìm kiếm < 15ms.
- **Chi phí hạ tầng thấp:** Toàn bộ hạ tầng Serverless (Neon, Upstash, R2) — không cần vận hành Docker/VPS riêng cho web chính.
- **Khả năng mở rộng:** Queue tách rời cho ingestion; view buffering giải phóng DB I/O; horizontal scaling tự nhiên theo mô hình serverless.

## 1.5. Chỉ số thành công (Success Metrics)

| Chỉ số | Mục tiêu |
| :--- | :--- |
| TTFB trang chính (cache hit) | < 100ms |
| Thời gian tìm kiếm truyện (pg_trgm) | < 15ms |
| Lighthouse Performance (trang chủ) | ≥ 90 |
| Độ trễ ghi lượt xem (buffer → DB) | ≤ 30 giây |
| Uptime /api/health | ≥ 99.9% |
| Kích thước ảnh sau Sharp | Giảm ≥ 40% so với gốc (WebP q80) |

## 1.6. Phạm vi & Ngoài phạm vi (In/Out of Scope)

**Trong phạm vi (v1):**
- Đọc truyện 3 chế độ, Eye-Care, phím tắt.
- Auth (JWT HttpOnly, RBAC 3 role), gamification EXP/Level/Streak.
- Bình luận lồng nhau + spoiler, đánh giá 1–5 sao, theo dõi, lịch sử đọc.
- Search không dấu tiếng Việt, filter đa tiêu chí, bảng xếp hạng.
- Admin panel đầy đủ (comics, chapters, genres, comments, reports, users).
- PWA offline từng chương, crawler ingestion pipeline, view buffering, SSE live readers.

**Ngoài phạm vi (v1):**
- Native mobile app (chỉ PWA).
- Thanh toán / Premium membership.
- Đa ngôn ngữ UI (i18n) — chỉ tiếng Việt.
- Forum / community mở rộng, chat real-time 1-1.

---

# 2️⃣ REQUIREMENTS (YÊU CẦU)

## 2.1. Yêu cầu chức năng (Functional Requirements)

### FR-1 — Xác thực & Quản lý người dùng

| Mã | Yêu cầu | Ưu tiên |
| :--- | :--- | :--- |
| FR-1.1 | Đăng ký bằng email + username + password (Argon2 hash); password tối thiểu 8 ký tự | P0 |
| FR-1.2 | Đăng nhập bằng email **hoặc** username; cấp Access Token + Refresh Token trong HttpOnly Secure Cookies | P0 |
| FR-1.3 | Refresh token tự động khi Access Token hết hạn; logout thu hồi refresh token khỏi DB | P0 |
| FR-1.4 | Quên mật khẩu: form nhập email (lưu ý: v1 chỉ dựng flow UI + stub gửi mail) | P2 |
| FR-1.5 | RBAC 3 role: `USER`, `MODERATOR`, `ADMIN`; `/admin/*` chặn truy cập nếu không phải MODERATOR/ADMIN | P0 |
| FR-1.6 | Hồ sơ cá nhân: avatar, username, EXP, Level, Daily Streak | P1 |

### FR-2 — Duyệt & Tìm kiếm truyện

| Mã | Yêu cầu | Ưu tiên |
| :--- | :--- | :--- |
| FR-2.1 | Trang chủ: banner nổi bật, truyện Hot (theo view), Mới cập nhật — render ISR `revalidate = 60` | P0 |
| FR-2.2 | Trang danh sách truyện: phân trang, filter theo thể loại (multi-select), trạng thái (ONGOING/COMPLETED/DROPPED), sắp xếp (views/rating/mới nhất) | P0 |
| FR-2.3 | Trang chi tiết truyện (`/comics/[slug]`): ảnh bìa, mô tả, tác giả, other names, thể loại, rating trung bình, danh sách chương, thống kê view | P0 |
| FR-2.4 | Tìm kiếm tức thì không dấu tiếng Việt (gõ "dao hai tac" → tìm thấy "Đảo Hải Tạc"), typo-tolerant qua `pg_trgm` + `unaccent` | P0 |
| FR-2.5 | Trang thể loại: danh sách tất cả categories, mỗi category dẫn tới danh sách truyện lọc sẵn | P1 |
| FR-2.6 | Bảng xếp hạng Top ngày/tuần/tháng (cache Redis TTL 15 phút) | P1 |

### FR-3 — Bộ đọc truyện (Reader Engine)

| Mã | Yêu cầu | Ưu tiên |
| :--- | :--- | :--- |
| FR-3.1 | 3 chế độ đọc: **Webtoon** (cuộn dọc), **Single Page Flip** (lật từng trang), **Double Page RTL** (manga kiểu Nhật) | P0 |
| FR-3.2 | Eye-Care: 4 chế độ nền (Light trắng, Dark xám, Sepia vàng dịu, AMOLED đen sâu) + thanh chỉnh độ sáng | P0 |
| FR-3.3 | Phím tắt: `A/D`, `←/→` (chuyển trang/chương), `F` (fullscreen), `M` (mở/đóng toolbar) | P1 |
| FR-3.4 | Reader Toolbar: chọn chương (select/slider), chuyển chương trước/sau, cài đặt hiển thị, nút "Tải chương offline" | P0 |
| FR-3.5 | Tự động lưu vị trí đọc (`lastReadPage`) vào History khi đăng nhập; đề xuất "Đọc tiếp trang N" | P1 |
| FR-3.6 | Preload ảnh trang kế (n+1, n+2) bằng Next/Image lazy loading | P1 |
| FR-3.7 | Hiển thị số người đang đọc chương này (SSE live reader count) | P2 |

### FR-4 — Tương tác xã hội

| Mã | Yêu cầu | Ưu tiên |
| :--- | :--- | :--- |
| FR-4.1 | Bình luận ở mức truyện và mức chương; hỗ trợ trả lời lồng nhau (nested, 1 cấp hiển thị cây) | P0 |
| FR-4.2 | Tag spoiler `[spoil]...[/spoil]` → render Blur/SpoilerBadge, click mới hiện nội dung | P0 |
| FR-4.3 | Like bình luận; nội dung được sanitize (DOMPurify/sanitize-html) trước khi lưu | P1 |
| FR-4.4 | Đánh giá 1–5 sao/truyện; 1 user 1 lần (upsert); tự động tính lại `ratingAvg`, `ratingCount` | P0 |
| FR-4.5 | Theo dõi (follow) truyện → trang `/followed` liệt kê truyện đang theo dõi, sắp theo chương mới nhất | P0 |
| FR-4.6 | Lịch sử đọc `/history`: truyện đã đọc + chương cuối + thời gian | P1 |
| FR-4.7 | Báo lỗi chương (ảnh hỏng, sai chương, loại khác) → Admin xử lý ở `/admin/reports` | P1 |
| FR-4.8 | Thông báo: chương mới của truyện đang follow, phản hồi bình luận — có `isRead`, dropdown ở Navbar | P2 |

### FR-5 — Gamification

| Mã | Yêu cầu | Ưu tiên |
| :--- | :--- | :--- |
| FR-5.1 | Tích EXP theo hành vi: đọc chương (+5), bình luận (+10), đánh giá (+10), daily login (+20) | P1 |
| FR-5.2 | Công thức level: `level = floor(sqrt(exp / 100)) + 1` (tunable trong config) | P1 |
| FR-5.3 | Daily Streak: tăng 1 nếu hoạt động trong ngày liên tiếp; reset về 0 nếu bỏ trống 1 ngày | P1 |

### FR-6 — PWA & Offline

| Mã | Yêu cầu | Ưu tiên |
| :--- | :--- | :--- |
| FR-6.1 | Service Worker caching app shell; installable (manifest.json, icons) | P1 |
| FR-6.2 | "Tải chương offline": fetch blob từng trang → lưu IndexedDB (store `chapters`) kèm metadata, hiển thị tiến trình 0→100% | P1 |
| FR-6.3 | Khi offline, Reader tự chuyển nguồn ảnh từ R2 CDN sang IndexedDB | P1 |
| FR-6.4 | Trang `/offline`: tủ truyện đã tải, xóa chương đã tải | P1 |

### FR-7 — Quản trị (Admin Panel)

| Mã | Yêu cầu | Ưu tiên |
| :--- | :--- | :--- |
| FR-7.1 | Dashboard: tổng truyện, chương, user, bình luận, lượt xem 24h — biểu thị dạng StatsCard + Chart | P1 |
| FR-7.2 | CRUD truyện: form đầy đủ (title, slug auto, otherNames, author, status, cover, banner, description, categories multi-select) | P0 |
| FR-7.3 | Quản lý chapter: tạo/sửa/xóa, upload ảnh qua Presigned URL R2 (drag-drop, sắp thứ tự trang) | P0 |
| FR-7.4 | CRUD thể loại | P1 |
| FR-7.5 | Kiểm duyệt bình luận: danh sách, tìm kiếm, ẩn/xóa | P1 |
| FR-7.6 | Xử lý báo lỗi: danh sách PENDING, chuyển RESOLVED/REJECTED | P1 |
| FR-7.7 | Quản lý user: danh sách, tìm kiếm, đổi role, khóa/mở | P1 |

### FR-8 — Ingestion Pipeline (Crawler)

| Mã | Yêu cầu | Ưu tiên |
| :--- | :--- | :--- |
| FR-8.1 | `POST /api/crawler/ingest`: nhận metadata truyện/chương, bảo vệ bằng Bearer `CRAWLER_SECRET_KEY` | P0 |
| FR-8.2 | Ingest endpoint đẩy job vào BullMQ queue (không xử lý đồng bộ) | P0 |
| FR-8.3 | Worker xử lý job: upsert Comic/Chapter/pages qua Prisma, idempotent (không trùng chapter theo `chapterNumber`) | P0 |
| FR-8.4 | Image Processor: Sharp convert → WebP quality 80 → upload R2 → trả về public URL | P0 |

### FR-9 — Hạ tầng & Vận hành

| Mã | Yêu cầu | Ưu tiên |
| :--- | :--- | :--- |
| FR-9.1 | View Buffering: đọc chương → `INCR` Redis key `comic:views:{id}` / `chapter:views:{id}`; worker flush về DB mỗi 30s bằng 1 batch SQL | P0 |
| FR-9.2 | `/api/health`: kiểm tra kết nối DB, Redis, R2; trả status + latency từng thành phần | P0 |
| FR-9.3 | Structured logging (Pino) cho server actions, workers, ingest | P1 |
| FR-9.4 | SEO: metadata động, OpenGraph, sitemap.xml, robots.txt cho truyện/chương | P1 |

## 2.2. Yêu cầu phi chức năng (Non-Functional Requirements)

### NFR-1 — Hiệu năng (Performance)

| Mã | Yêu cầu | Mục tiêu đo |
| :--- | :--- | :--- |
| NFR-1.1 | TTFB trang ISR/cache hit | < 100ms |
| NFR-1.2 | Latency search pg_trgm (P95) | < 15ms |
| NFR-1.3 | Redis cache hit cho chapter pages | < 2ms |
| NFR-1.4 | Lighthouse Performance trang chủ / trang đọc | ≥ 90 / ≥ 80 |
| NFR-1.5 | Độ trễ flush view buffer | ≤ 30s chu kỳ |

### NFR-2 — Bảo mật (Security)

| Mã | Yêu cầu |
| :--- | :--- |
| NFR-2.1 | JWT Access/Refresh đặt trong **HttpOnly + Secure + SameSite** cookies — chặn XSS đánh cắp token |
| NFR-2.2 | Rate limit tại Edge Middleware: login/register 5 req/phút; comment/rating 15 req/phút |
| NFR-2.3 | Sanitize toàn bộ nội dung comment bằng sanitize-html/DOMPurify phía server trước khi persist |
| NFR-2.4 | Ingest API yêu cầu Bearer secret; từ chối 401 nếu sai `CRAWLER_SECRET_KEY` |
| NFR-2.5 | Zod validation cho mọi Server Action & Route Handler input |
| NFR-2.6 | (Tùy chọn) Cloudflare Turnstile cho form đăng ký & báo lỗi |
| NFR-2.7 | Argon2id cho password hashing |

### NFR-3 — Độ tin cậy & Khả năng mở rộng (Reliability & Scalability)

| Mã | Yêu cầu |
| :--- | :--- |
| NFR-3.1 | Hạ tầng web chính 100% serverless (Neon + Upstash + R2) — không Docker/VPS bắt buộc |
| NFR-3.2 | Worker tách tiến trình (`npm run worker`), crash không ảnh hưởng web |
| NFR-3.3 | Ingest idempotent — retry an toàn, không tạo chapter trùng |
| NFR-3.4 | Graceful degradation: nếu Redis lỗi → fallback query DB trực tiếp |

### NFR-4 — Chất lượng code & Kỹ thuật

| Mã | Yêu cầu |
| :--- | :--- |
| NFR-4.1 | TypeScript strict mode; không dùng `any` trong domain logic |
| NFR-4.2 | Prisma là nguồn sự thật duy nhất cho schema; mọi thay đổi qua `prisma migrate` |
| NFR-4.3 | ESLint + Prettier enforced |
| NFR-4.4 | Secrets chỉ nằm trong `.env` (đã gitignore); `.env.example` mô tả đủ biến |

### NFR-5 — Trải nghiệm người dùng (UX)

| Mã | Yêu cầu |
| :--- | :--- |
| NFR-5.1 | Dark/Light/Sepia/AMOLED theme toàn site, lưu localStorage |
| NFR-5.2 | Mobile-first responsive; PWA installable |
| NFR-5.3 | Micro-animations bằng Framer Motion, không chặn render |
| NFR-5.4 | Trang lỗi 404/global-error thân thiện tiếng Việt |

## 2.3. Ràng buộc (Constraints)

- **Nền tảng:** Next.js 15+ App Router, React 19, TypeScript 5.x — bắt buộc.
- **CSDL:** Neon PostgreSQL với 2 connection string (`DATABASE_URL` pooler, `DIRECT_URL` direct cho migration).
- **Cache:** Upstash Redis (REST cho Edge + TCP/ioredis cho Worker).
- **Storage:** Cloudflare R2 qua AWS SDK v3 (S3-compatible).
- **Ngôn ngữ UI:** Tiếng Việt.
- **Không dùng** search engine ngoài (Elasticsearch/Meilisearch) — chỉ PostgreSQL FTS.

## 2.4. Chấp nhận rủi ro đã biết (Accepted Trade-offs)

- `unstable_cache` là API thí nghiệm của Next — chấp nhận rủi ro API đổi, bọc lại trong `cache.service.ts` để đổi chỗ dễ.
- Redis buffer view có thể mất tối đa 30s dữ liệu nếu crash — chấp nhận được với số liệu view.
- SSE (thay vì WebSocket) cho live readers: đơn giản hơn, đủ dùng cho read-only updates.

---

# 3️⃣ DESIGN (THIẾT KẾ)

## 3.1. Kiến trúc tổng thể

```
Client (Browser/PWA)
   │ HTTPS/HTTP2
   ▼
Cloudflare Edge (CDN/WAF/Turnstile)
   │ Reverse Proxy
   ▼
Next.js Fullstack Engine (App Router)
 ├── Presentation:  RSC (SSR/ISR)  +  Client Components (Reader/PWA)
 ├── API Layer:     Edge Middleware → Server Actions | Route Handlers | SSE
 └── Core Services: Auth | Comic | Cache | Gamification | Search | Storage
        │                    │                      │
        ▼                    ▼                      ▼
  Neon PostgreSQL      Upstash Redis         Cloudflare R2
  (Prisma, pg_trgm)    (cache, rate limit,   (ảnh truyện,
                        BullMQ, view buffer)   presigned upload)

Background Worker Layer (tiến trình riêng `npm run worker`)
 ├── BullMQ Ingestion Worker  ← jobs từ POST /api/crawler/ingest
 ├── Crawler Engine + Sharp Image Pipeline → R2
 └── View Sync Worker (flush Redis views → DB mỗi 30s, 1 batch SQL)
```

**Nguyên tắc phân lớp:**
- `app/` (pages) và `actions/` (server actions) **không** gọi Prisma trực tiếp — luôn qua `services/`.
- `services/` chứa business logic thuần, gọi `lib/` clients (prisma, redis, s3).
- `workers/` chạy tiến trình Node riêng, dùng ioredis (TCP) thay vì REST.

## 3.2. Công nghệ & Quyết định kỹ thuật

| Hạng mục | Lựa chọn | Lý do |
| :--- | :--- | :--- |
| Framework | Next.js 15 App Router + React 19 | RSC tối ưu SEO/TTFB; hợp nhất FE/BE |
| Ngôn ngữ | TypeScript 5 strict | Type-safety end-to-end đến Prisma types |
| Styling | Tailwind CSS + Lucide + Framer Motion | Dark mode, micro-animations |
| Client state | Zustand (reader settings) + TanStack Query (client cache) | Nhẹ, tách bạch state cục bộ vs server cache |
| ORM/DB | Prisma + Neon PostgreSQL | Serverless pooler, `DIRECT_URL` cho migrate |
| Auth | Auth.js v5 + Jose (JWT) + Argon2 | HttpOnly cookie, RBAC, edge verify |
| Cache | @upstash/redis + `unstable_cache` | REST edge-ready + tag invalidation |
| Rate limit | @upstash/ratelimit (sliding window) | Chống brute-force/spam tại edge |
| Search | pg_trgm + unaccent + GIN index | Không dấu, typo-tolerant, < 15ms, không thêm service |
| Storage | @aws-sdk/client-s3 → R2 | S3-compatible, presigned upload |
| Ảnh | Sharp (worker) + next/image (client) | WebP q80, srcset, lazy + preload |
| Queue | BullMQ + ioredis | Ingestion + batch jobs tách tiến trình |
| PWA | Serwist/next-pwa + idb | Offline chapters, SW caching |
| Logging | Pino | Structured JSON logs |
| Validation | Zod | Mọi input của actions/handlers |

## 3.3. Cấu trúc thư mục đích

```
truyenkomi-next/
├── prisma/{schema.prisma, migrations/}
├── public/{manifest.json, sw.js, icons/}
├── src/
│   ├── app/
│   │   ├── (auth)/{login, register, forgot-password}/page.tsx
│   │   ├── (main)/
│   │   │   ├── layout.tsx, page.tsx
│   │   │   ├── comics/{page.tsx, [slug]/{page.tsx, [chapter]/page.tsx}}
│   │   │   ├── {categories, history, followed, offline, profile, search}/page.tsx
│   │   ├── (admin)/admin/{page.tsx, comics, chapters, genres, comments, reports, users}/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── comics/route.ts, chapters/[id]/route.ts
│   │   │   ├── comments/route.ts, ratings/route.ts
│   │   │   ├── upload/route.ts                 # presigned R2
│   │   │   ├── crawler/ingest/route.ts         # Bearer secret
│   │   │   ├── realtime/sse/route.ts
│   │   │   └── health/route.ts
│   │   ├── global-error.tsx, not-found.tsx, layout.tsx
│   ├── actions/{auth, comic, comment, rating, user, report}.actions.ts
│   ├── components/{ui, common, comic, reader, comment, admin}/
│   ├── services/{auth, comic, chapter, comment, cache, storage, search,
│   │              gamification, notification}.service.ts
│   ├── lib/{prisma.ts, redis.ts, rate-limiter.ts, s3.ts, text-normalizer.ts, logger.ts, env.ts}
│   ├── hooks/{use-reader-settings.ts, use-offline-storage.ts, use-live-readers.ts}
│   ├── stores/reader-store.ts
│   ├── types/ (DTOs & interfaces)
│   └── middleware.ts
├── workers/{index.ts, crawler.worker.ts, image-processor.ts, view-sync.worker.ts}
└── next.config.ts
```

## 3.4. Mô hình dữ liệu (tóm tắt — chi tiết xem `architecture_nextjs.md` §5)

**11 model Prisma:**

| Model | Trường chính | Quan hệ |
| :--- | :--- | :--- |
| `User` | username, email (unique), passwordHash, role(enum), exp, level, dailyStreak, refreshToken | 1-n: Comment, Rating, Follow, History, Notification, Report |
| `Comic` | title, titleUnaccent, slug(unique), status(enum), views/monthlyViews/weeklyViews (BigInt), ratingAvg, ratingCount | 1-n: Chapter, Comment, Rating, Follow, History; n-n: Category |
| `Category` | name, slug (unique) | n-n Comic |
| `ComicCategory` | PK kép (comicId, categoryId), Cascade | join table |
| `Chapter` | chapterNumber(Float), `@@unique([comicId, chapterNumber])` | thuộc Comic; 1-n ChapterPage, Comment, Report |
| `ChapterPage` | pageIndex, imageUrl, `@@unique([chapterId, pageIndex])` | thuộc Chapter |
| `Comment` | content, isSpoiler, likes, parentId (self-relation "Replies"), chapterId nullable | User/Comic/Chapter |
| `Follow` | PK kép (userId, comicId) | User ↔ Comic |
| `History` | PK kép (userId, comicId), chapterId, lastReadPage | User ↔ Comic ↔ Chapter |
| `ComicRating` | PK kép (userId, comicId), score 1–5 | User ↔ Comic |
| `Notification` | title, message, linkUrl, isRead | thuộc User |
| `Report` | reason, status PENDING/RESOLVED/REJECTED, userId nullable (SetNull) | Chapter (+ User optional) |

**Index chiến lược:**
- `Comic.titleUnaccent` — GIN trigram cho search không dấu.
- `Comic.views(sort: Desc)` — ranking top.
- `Comment(comicId, createdAt Desc)` — feed bình luận mới nhất.
- `Chapter(comicId, chapterNumber)` — danh sách chương.

## 3.5. Thiết kế API

### Server Actions (`src/actions/`) — cho mutations từ UI

| Action | Input (Zod) | Output | Auth | Cache effect |
| :--- | :--- | :--- | :--- | :--- |
| `loginAction` | identifier + password | `{success}` + set cookies | public | — |
| `registerAction` | username, email, password | `{success}` | public, rate 5/min | — |
| `logoutAction` | — | clear cookies | user | — |
| `followComicAction` | comicId | `{following: bool}` | user | — |
| `rateComicAction` | comicId, score 1–5 | `{ratingAvg, ratingCount}` | user, rate 15/min | revalidate comic tag |
| `addCommentAction` | comicId, chapterId?, content, parentId? | Comment DTO | user, rate 15/min | revalidate comments |
| `likeCommentAction` | commentId | `{likes}` | user | — |
| `reportChapterAction` | chapterId, reason | `{success}` | user (nullable) | — |
| `updateHistoryAction` | comicId, chapterId, lastReadPage | `{success}` | user | — |
| `markNotificationRead` | notificationId | `{success}` | user | — |
| Admin: `upsertComic`, `deleteComic`, `upsertChapter`, `deleteChapter`, `upsertGenre`, `deleteGenre`, `setUserRole`, `moderateComment`, `resolveReport` | các DTO tương ứng | — | mod/admin | revalidateTag tương ứng |

### Route Handlers (`src/app/api/`) — cho máy/hệ thống

| Endpoint | Method | Auth | Chức năng |
| :--- | :--- | :--- | :--- |
| `/api/auth/[...nextauth]` | * | public | Auth.js routes |
| `/api/comics` | GET | public | Danh sách truyện (query: filter, sort, pagination) |
| `/api/chapters/[id]` | GET | public | Chi tiết chương + pages (qua cache service) |
| `/api/comments` | GET | public | Phân trang bình luận theo comic/chapter |
| `/api/ratings` | POST | user | Đánh giá (dùng cho fetch từ client) |
| `/api/upload` | POST | admin | Trả presigned URL R2 cho upload ảnh |
| `/api/crawler/ingest` | POST | Bearer `CRAWLER_SECRET_KEY` | Nhận payload truyện/chapter → đẩy BullMQ |
| `/api/realtime/sse` | GET | public | SSE stream: live reader count theo chapterId |
| `/api/health` | GET | public | DB + Redis + R2 check, latency từng thành phần |

### Contract payload Ingest (ví dụ)

```jsonc
POST /api/crawler/ingest
Authorization: Bearer <CRAWLER_SECRET_KEY>
{
  "comic": { "title": "Đảo Hải Tạc", "slug": "dao-hai-tac", "author": "...",
             "status": "ONGOING", "categories": ["Hành Động", "Phiêu Lưu"] },
  "chapters": [
    { "chapterNumber": 1, "title": "Khởi đầu",
      "pages": [ "https://nguon-ngoai/img-001.jpg", "https://nguon-ngoai/img-002.jpg" ] }
  ]
}
// Response: { "jobIds": ["job_abc123"], "queued": 1 }
// Worker: tải pages → Sharp WebP q80 → upload R2 → upsert DB (idempotent theo chapterNumber)
```

## 3.6. Thiết kế Caching & Buffer

**Cache keys Redis:**

| Key | Giá trị | TTL |
| :--- | :--- | :--- |
| `chapter:{id}:pages` | JSON danh sách image URLs | 2h |
| `ranking:daily` / `:weekly` / `:monthly` | JSON top comics | 15 min |
| `comic:views:{comicId}` | counter (INCR) | vĩnh viễn, do worker flush & reset |
| `chapter:views:{chapterId}` | counter (INCR) | như trên |
| `ratelimit:*` | sliding window counters | theo cấu hình |

**Cache tags Next (`unstable_cache`):**
- `comic-detail-{slug}` — invalidate khi sửa truyện/thêm chương (`revalidateTag`).
- `comic-list` — invalidate khi thêm/xóa truyện.
- `home-feed` — gắn với `revalidate = 60`.

**Quy tắc xóa cache an toàn:** dùng `SCAN` cursor theo pattern, **tuyệt đối không** `KEYS *`.

**View Buffer Flow:**
1. Reader mở chapter → RSC gọi `cache.service.incrView(comicId, chapterId)`.
2. Worker `view-sync.worker.ts` chạy mỗi 30s: `SCAN comic:views:*` + `chapter:views:*` → đọc giá trị → `DEL` key (nguyên tử bằng GETDEL nếu hỗ trợ) → gộp thành 1 câu `UPDATE ... FROM (VALUES ...)` batch SQL.
3. Monthly/weekly views được reset theo lịch cron trong worker (00h ngày đầu tháng/tuần).

## 3.7. Thiết kế bảo mật

- **Token flow:** Access JWT (15 phút, verify tại Edge Middleware bằng `jose` — chạy được trên edge runtime) + Refresh JWT (30 ngày, lưu hash trong `User.refreshToken`, rotate mỗi lần refresh).
- **Middleware matcher:** `/admin/:path*` (RBAC), `/api/crawler/:path*` (Bearer secret), các action nhạy cảm (rate limit).
- **Sanitize pipeline comment:** strip thẻ HTML, chỉ cho phép `[spoil]` tag tự định nghĩa → parse sang `<SpoilerBadge>` component phía client.
- **Zod schemas** đặt trong `src/types/schemas.ts`, dùng chung cho action + API + form validation.

## 3.8. Luồng chính (tham chiếu nhanh)

- **Auth:** Login form → `loginAction` → `AuthService` verify Argon2 → set HttpOnly cookies → router refresh. (Chi tiết: `architecture_nextjs.md` §6.1)
- **Đọc chương:** RSC → Redis GET `chapter:{id}:pages` (miss → DB → SETEX 2h) → INCR views → render + next/image từ R2 CDN. (§6.2)
- **Tải offline:** Reader Toolbar → loop fetch blob từ R2 → lưu IndexedDB store `chapters` → offline reader đọc từ IDB. (§6.3)
- **Ingest:** Crawler → POST `/api/crawler/ingest` (Bearer) → BullMQ queue → worker: download → Sharp → R2 → Prisma upsert. (§4.4)

## 3.9. Biến môi trường (đã có `.env.example`)

```
DATABASE_URL, DIRECT_URL                    # Neon (pooler / direct)
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
UPSTASH_REDIS_URL_TCP (mới — cho BullMQ/ioredis worker)
R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN
NEXTAUTH_SECRET, NEXTAUTH_URL, CRAWLER_SECRET_KEY
```

---

# 4️⃣ TASKS (DANH SÁCH CÔNG VIỆC)

> **Quy ước:** Mỗi Task có mã `Tx.y`, thực thi được ngay (file cụ thể + tiêu chí hoàn thành **DoD** — Definition of Done). Thứ tự Phase = thứ tự phụ thuộc khuyến nghị. Các task trong cùng phase độc lập nhau trừ khi ghi chú.

## Phase 0 — Khởi tạo dự án & Nền tảng (Foundation)

- [x] **T0.1 — Scaffold Next.js 15 project**
  - Chạy `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`.
  - Dọn template mặc định (trang `page.tsx`, logo).
  - **DoD:** `npm run dev` chạy tại `localhost:3000`, build pass không lỗi TS.

- [x] **T0.2 — Cài đặt toàn bộ dependencies**
  - Dependencies: `@prisma/client`, `@auth/core next-auth@beta`, `jose`, `argon2`, `zod`, `@upstash/redis @upstash/ratelimit`, `ioredis bullmq`, `@aws-sdk/client-s3 @aws-sdk/s3-request-presigner`, `zustand @tanstack/react-query`, `framer-motion lucide-react`, `sanitize-html`, `pino`, `idb`.
  - DevDependencies: `prisma`, `@types/argon2 @types/sanitize-html`, `prettier prettier-plugin-tailwindcss`.
  - **DoD:** `npm install` sạch lỗi; `package.json` có đủ script `dev`, `build`, `start`, `worker`, `lint`.

- [x] **T0.3 — Environment & validation**
  - Copy `.env.example` → cập nhật thêm `UPSTASH_REDIS_URL_TCP`; tạo `src/lib/env.ts` validate bằng Zod (fail-fast khi thiếu biến).
  - Đảm bảo `.gitignore` đã có `.env`.
  - **DoD:** App thiếu 1 biến bất kỳ → throw lỗi rõ ràng khi khởi động; đầy đủ biến → boot bình thường.

- [x] **T0.4 — Cấu hình `next.config.ts`**
  - `images.remotePatterns`: `R2_PUBLIC_DOMAIN` + placeholder nguồn ngoài; `formats: ['image/webp','image/avif']`.
  - Security headers cơ bản (CSP thuởng đầu, X-Frame-Options, Referrer-Policy).
  - **DoD:** Build pass; `<Image>` từ domain R2 render đúng.

## Phase 1 — Database & Core Clients

- [x] **T1.1 — Prisma schema + migration init**
  - Tạo `prisma/schema.prisma` đúng 100% theo §5 `architecture_nextjs.md` (12 model + 3 enum: `Role`, `ComicStatus`, giữ `Report.status` string).
  - `npx prisma migrate dev --name init` trên Neon (dùng `DIRECT_URL`).
  - **DoD:** `npx prisma studio` mở được, các bảng/index/unique constraint khớp spec.

- [x] **T1.2 — PostgreSQL extensions & search indexes**
  - Tạo migration SQL: `CREATE EXTENSION IF NOT EXISTS unaccent; CREATE EXTENSION IF NOT EXISTS pg_trgm;`
  - Tạo GIN index: `CREATE INDEX comics_title_trgm ON "Comic" USING gin (title_unaccent gin_trgm_ops);` + unaccent trigger/luôn ghi `titleUnaccent` từ application (qua `text-normalizer`).
  - **DoD:** Query demo `similarity(unaccent(title_unaccent), 'dao hai tac')` hoạt động, dùng được index (EXPLAIN có Bitmap Index Scan).

- [x] **T1.3 — Core client singletons**
  - `src/lib/prisma.ts` — global singleton (tránh exhausted connection trong dev).
  - `src/lib/redis.ts` — export 2 client: `redisRest` (Upstash REST, cho app) + `redisTcp` (ioredis, cho worker/BullMQ).
  - `src/lib/s3.ts` — R2 client từ `@aws-sdk/client-s3` (endpoint `https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com`).
  - `src/lib/logger.ts` — Pino instance.
  - **DoD:** Script smoke test kết nối được cả 3 service in log OK.

- [x] **T1.4 — `src/lib/text-normalizer.ts`**
  - Hàm `toUnaccent(str)` (bỏ dấu tiếng Việt, lowercase, trim) + `toSlug(str)` (slug chuẩn, giữ số).
  - Viết unit test cho 10 case tiếng Việt ("Đảo Hải Tạc" → "dao hai tac" / "dao-hai-tac").
  - **DoD:** Test pass 10/10.

## Phase 2 — Core Services (Backend Logic)

- [x] **T2.1 — `cache.service.ts`**
  - Methods: `getJson/setJson` (TTL), `incrView(comicId, chapterId)`, `getRanking(period)`, `invalidatePattern(pattern)` dùng `SCAN` (không KEYS), wrapper `cached(key, tags, ttl, fn)` bọc `unstable_cache`.
  - **DoD:** Đọc ghi Redis round-trip OK; `invalidatePattern` xóa đúng key theo pattern trong test.

- [x] **T2.2 — `storage.service.ts`**
  - Methods: `getPresignedPutUrl(key, contentType)`, `uploadBuffer(key, buffer, contentType)` (dùng cho worker), `publicUrl(key)` tra `R2_PUBLIC_DOMAIN`.
  - **DoD:** Upload 1 file test lên R2 đọc được qua public URL; presigned URL put thành công từ client test.

- [x] **T2.3 — `search.service.ts`**
  - `searchComics(query, {limit, offset})` dùng `similarity(unaccent(...))` + `ILIKE` fallback; ranking theo score + views.
  - **DoD:** "dao hai tac" trả về "Đảo Hải Tạc"; kết quả < 15ms (log timing); query rỗng trả [] nhanh.

- [x] **T2.4 — `auth.service.ts`**
  - `register`, `login(identifier, password)` (Argon2 verify), `createTokens`, `rotateRefreshToken`, `revokeRefreshToken`, `getSessionFromCookie` (jose verify cho edge).
  - **DoD:** Unit test: đúng/sai password, token hết hạn, refresh rotate invalidate token cũ.

- [x] **T2.5 — `comic.service.ts`**
  - `getHomeFeed()` (hot + latest, tag `home-feed`), `getBySlug(slug)` (tag `comic-detail-{slug}`), `listComics(filters)`, `getRankings(period)`.
  - **DoD:** Gọi 2 lần liên tiếp → lần 2 hit cache (verify qua log/latency).

- [x] **T2.6 — `chapter.service.ts`**
  - `getChapterPages(comicSlug, chapterNumber)` — Redis cache `chapter:{id}:pages` TTL 2h, fallback DB, gọi `incrView`.
  - `getAdjacentChapters` (prev/next), `getLastReadChapter(userId, comicId)`.
  - **DoD:** Cache miss→hit xác minh được; view counter tăng đúng key.

- [x] **T2.7 — `comment.service.ts`**
  - `listComments(comicId, chapterId?, cursor)` cursor pagination; `create` (sanitize + parse `[spoil]`); `like`; `delete` (mod).
  - **DoD:** chuỗi `<script>` trong content bị strip; `[spoil]x[/spoil]` lưu thành `isSpoiler=true` + content sạch.

- [x] **T2.8 — `gamification.service.ts`**
  - `awardExp(userId, amount)`, `computeLevel(exp)`, `touchDailyStreak(userId)` (so `lastActiveAt` theo ngày, reset nếu bỏ trống).
  - **DoD:** Unit test công thức level + 3 case streak (liên tiếp/đứt 1 ngày/cùng ngày không tăng).

- [x] **T2.9 — `notification.service.ts`**
  - `notify(userId, {title, message, linkUrl})`, `listUnread(userId)`, `markRead(id)`, `notifyFollowers(comicId, chapter)` (gọi khi worker lưu chapter mới).
  - **DoD:** Thêm chapter test → user follow nhận notification đúng.

## Phase 3 — Auth UI & Middleware

- [x] **T3.1 — Auth.js v5 config**
  - `src/lib/auth-config.ts` + `src/app/api/auth/[...nextauth]/route.ts`; Credentials provider gọi `auth.service`; callback gắn `role` vào JWT/session.
  - **DoD:** Đăng nhập qua UI tạo session; `auth()` trả user + role.

- [x] **T3.2 — Edge Middleware (`src/middleware.ts`)**
  - Verify JWT (jose, edge runtime); `/admin/*` yêu cầu MODERATOR/ADMIN, redirect `/login?next=...`; `/api/crawler/*` check Bearer secret; gắn rate limit (login 5/min, comment 15/min) qua `src/lib/rate-limiter.ts`.
  - **DoD:** Anonymous vào `/admin` bị redirect; sai secret gọi ingest → 401; spam login 6 lần → 429.

- [x] **T3.3 — Server Actions auth (`src/actions/auth.actions.ts`)**
  - `loginAction`, `registerAction`, `logoutAction` với Zod + error state tiếng Việt.
  - **DoD:** Sai mật khẩu hiện lỗi không lộ thông tin user tồn tại; thành công redirect `/`.

- [x] **T3.4 — Auth pages**
  - `(auth)/layout.tsx` + `login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx` — form dùng `useActionState`, validate client, loading states.
  - **DoD:** Flow register → tự login → vào trang chủ với avatar navbar.

## Phase 4 — Giao diện độc giả (Reader-facing UI)

- [x] **T4.1 — Design system (`src/components/ui/`)**
  - `Button`, `Input`, `Modal`, `Toast` (toast store), `Select`, `Skeleton`, `Badge`, `Pagination`.
  - **DoD:** Storybook không bắt buộc; một trang `/dev/ui` preview tất cả (xóa trước production).

- [x] **T4.2 — Theme system**
  - Tailwind config 4 themes (light/dark/sepia/amoled) qua `data-theme` + class strategy; store Zustand persist localStorage; áp cho toàn site.
  - **DoD:** Đổi theme → lưu, reload giữ nguyên; reader dùng đúng 4 nền.

- [x] **T4.3 — Main layout (`(main)/layout.tsx`)**
  - `Navbar` (logo, search box, notification dropdown, avatar menu), `Footer`, container responsive.
  - **DoD:** Layout hiển thị đúng trên mobile/desktop; notification dropdown load từ service.

- [x] **T4.4 — Trang chủ (`(main)/page.tsx`)**
  - Sections: Banner carousel, Hot Comics, Mới cập nhật; dùng `comic.service.getHomeFeed()` + `export const revalidate = 60`.
  - Components: `ComicCard`, `ComicGrid`, `ComicCarousel`.
  - **DoD:** ISR hoạt động (response header age tăng); Lighthouse ≥ 90.

- [x] **T4.5 — Danh sách truyện + filter (`(main)/comics/page.tsx`)**
  - Search params: `?genres=&status=&sort=&page=`; `FilterSidebar` (multi genres), sort select, pagination; RSC render.
  - **DoD:** Filter/sort/pagination thay đổi URL shareable; kết quả đúng theo tổ hợp filter.

- [x] **T4.6 — Chi tiết truyện (`(main)/comics/[slug]/page.tsx`)**
  - Cover, banner, meta, description, categories, `RatingStar` (interactive nếu login), `ChapterList` (phân nhóm, tìm chương), nút Follow, view count, bình luận section.
  - `generateMetadata` động OG; cache tag `comic-detail-{slug}`.
  - **DoD:** Thêm chương mới (test qua service) + `revalidateTag` → trang cập nhật không cần rebuild.

- [x] **T4.7 — Reader Engine (`(main)/comics/[slug]/[chapter]/page.tsx` + `components/reader/`)**
  - `WebtoonReader` (cuộn dọc, next/image), `PageFlipReader` (single), `DoubleRTLReader` (2 trang, đảo RTL).
  - `ReaderToolbar`: chọn chương, prev/next, settings panel (chế độ đọc, nền, độ sáng), nút tải offline.
  - `reader-store.ts` (Zustand persist): mode, theme, brightness, fitWidth.
  - Phím tắt `A/D`, `←/→`, `F`, `M` trong `use-reader-settings.ts`.
  - Preload trang n+1, n+2.
  - **DoD:** 3 mode chuyển mượt, settings persist; đủ phím tắt; mobile swipe hoạt động.

- [x] **T4.8 — Tìm kiếm (`(main)/search/page.tsx`)**
  - Ô search navbar (debounce 300ms, suggest 5 kết quả) + trang kết quả đầy đủ phân trang; dùng `search.service`.
  - **DoD:** Gõ không dấu tìm thấy truyện có dấu; suggest hiện < 300ms sau khi ngừng gõ.

- [x] **T4.9 — Trang còn lại**
  - `categories/page.tsx` (grid thể loại + số truyện), `history/page.tsx`, `followed/page.tsx`, `profile/page.tsx` (EXP bar, level, streak, lịch sử activity).
  - `history` + `followed`: server component đọc qua service, yêu cầu login (redirect).
  - **DoD:** 4 trang render đúng dữ liệu thật từ DB; unauthorized bị redirect login.

## Phase 5 — Tương tác xã hội (Actions & UI)

- [x] **T5.1 — Comment system**
  - `src/actions/comment.actions.ts` (`addCommentAction`, `likeCommentAction`) + `components/comment/` (`CommentList` cursor infinite scroll, `CommentItem`, `CommentForm`, `SpoilerBadge`).
  - **DoD:** Comment level comic + chapter; reply lồng 1 cấp; spoiler blur click-để-xem; rate limit hoạt động.

- [x] **T5.2 — Rating system**
  - `rating.actions.ts` (`rateComicAction` — transaction upsert + recalc `ratingAvg/Count` + awardExp); `RatingStar` interactive + hiển thị trung bình.
  - **DoD:** Đánh giá lần 2 → update (không trùng); avg/count cập nhật tức thì sau `revalidatePath`.

- [x] **T5.3 — Follow system**
  - `comic.actions.ts` thêm `followComicAction`/`unfollow`; nút Follow toggles; trang followed sắp theo chapter mới nhất.
  - **DoD:** Follow → nhận notification khi worker thêm chapter mới (test).

- [x] **T5.4 — History tracking**
  - `updateHistoryAction` gọi từ Reader (debounce) ghi `lastReadPage`; ComicDetail hiện "Đọc tiếp chương X trang Y".
  - **DoD:** Đọc 3 chương → `/history` đúng 1 entry/comic với chương cuối.

- [x] **T5.5 — Report & Notification UI**
  - `report.actions.ts` + modal báo lỗi từ Reader; Navbar notification dropdown (đánh dấu đã đọc, link tới `linkUrl`).
  - **DoD:** Gửi report → hiện trong admin reports (PENDING); notification click điều hướng đúng.


## Phase 6 — Admin Panel

- [x] **T6.1 — Admin shell (`(admin)/layout.tsx`)**
  - Sidebar điều hướng (Dashboard, Comics, Chapters, Genres, Comments, Reports, Users), guard ở layout (double-check với middleware).
  - **DoD:** USER role bị chặn cả ở middleware lẫn layout.

- [x] **T6.2 — Dashboard (`/admin`)**
  - `StatsCard` (tổng truyện/chương/user/comment, views 24h từ Redis) + LineChart views 7 ngày (recharts hoặc tương đương).
  - **DoD:** Số liệu khớp DB; chart render từ data thật.

- [x] **T6.3 — Comics management (`/admin/comics`)**
  - `DataTable` (search, phân trang) + Form thêm/sửa (react-hook-form + Zod): tự sinh slug từ title (edit được), multi-select categories, upload cover/banner.
  - **DoD:** CRUD đầy đủ; sau lưu gọi `revalidateTag('comic-detail-{slug}')` — trang chi tiết cập nhật ngay.

- [x] **T6.4 — ImageUploader + Presigned flow**
  - `POST /api/upload` trả presigned PUT URL; `ImageUploader` component drag-drop nhiều ảnh, upload thẳng R2, sắp thứ tự (dnd), trả list URL.
  - **DoD:** Upload 10 ảnh 2MB từ browser → xuất hiện trên R2 + preview đúng thứ tự.

- [x] **T6.5 — Chapters management (`/admin/chapters`)**
  - Chọn comic → danh sách chương; form tạo/sửa chương: số chương (hỗ trợ 0.5), tiêu đề, `ImageUploader` cho pages; xóa chương (cascade pages).
  - **DoD:** Tạo chương 1.5 không vỡ `@@unique`; trang đọc hiển thị đúng thứ tự page.

- [x] **T6.6 — Genres management (`/admin/genres`)**
  - CRUD thể loại (name, slug auto, description); validation trùng tên.
  - **DoD:** Thêm thể loại mới xuất hiện ở FilterSidebar + trang categories.

- [x] **T6.7 — Comments & Reports moderation**
  - `/admin/comments`: bảng tìm kiếm, xóa; `/admin/reports`: PENDING → RESOLVED/REJECTED kèm link tới chapter.
  - **DoD:** Report chuyển trạng thái đúng; comment xóa khỏi feed công khai ngay.

- [x] **T6.8 — Users management (`/admin/users`)**
  - Bảng user + search; đổi role (USER↔MODERATOR↔ADMIN, chỉ ADMIN được đổi); khóa/mở tài khoản (thêm field `isBanned` nếu cần — nâng cấp schema).
  - **DoD:** Đổi role MODERATOR → user đó vào được `/admin`.


## Phase 7 — PWA & Realtime

- [x] **T7.1 — PWA manifest + Service Worker**
  - `public/manifest.json` + icons; cấu hình Serwist/next-pwa trong `next.config.ts` (cache app shell, runtime cache ảnh R2).
  - **DoD:** Lighthouse PWA installable; tab Applications có SW active.

- [x] **T7.2 — Offline storage (`use-offline-storage.ts` + `OfflineStorageService`)**
  - IDB store `chapters` (key `chapterId`, value {pages: Blob[], meta}); hook `downloadChapter(chapterId)` trả tiến trình 0–100%; `getOfflineChapter`, `removeOfflineChapter`, `listOffline`.
  - Reader: fetch ảnh thất bại/`navigator.onLine === false` → fallback blob URL từ IDB.
  - **DoD:** Tải chương → tắt mạng → reload → đọc được chương từ IDB.

- [x] **T7.3 — Trang `/offline`**
  - Tủ truyện: list chương đã tải (từ IDB) + dung lượng ước tính + nút xóa.
  - **DoD:** Đúng dữ liệu IDB; xóa giải phóng space (verify qua `navigator.storage.estimate()`).

- [x] **T7.4 — SSE live readers (`use-live-readers.ts`)**
  - `GET /api/realtime/sse?chapterId=` — stream count mỗi 5s (count từ Redis key `chapter:online:{id}` with TTL heartbeat do client ping); hook subscribe + reconnect auto.
  - **DoD:** 2 tab mở cùng chương → cả 2 hiện count ≥ 2; đóng 1 tab → count giảm sau ≤ 10s.


## Phase 8 — Ingestion Pipeline & Workers

- [x] **T8.1 — BullMQ setup (`workers/index.ts`)**
  - 2 queue: `ingestion` (concurrency 2), `view-sync` (repeat job 30s). Connection ioredis TCP. Script `npm run worker` → `tsx workers/index.ts`.
  - **DoD:** Worker start, log sẵn sàng, kết nối Redis TCP OK.

- [x] **T8.2 — Ingest API (`/api/crawler/ingest`)**
  - Zod validate payload (schema §3.5); check Bearer; tạo job per comic payload; trả `{jobIds}`. Tự động upsert Comic metadata ngay (đồng bộ) — phần ảnh/chapter vào queue.
  - **DoD:** Sai secret → 401; payload hợp lệ → job xuất hiện trong queue (verify Redis `LRANGE`).

- [x] **T8.3 — Image processor (`workers/image-processor.ts`)**
  - `processImage(buffer)`: Sharp → resize giới hạn 1600px width → `webp({quality: 80})` → upload R2 key `comics/{comicSlug}/ch-{number}/{pageIndex}.webp` → trả public URL.
  - **DoD:** Ảnh JPEG 5MB test → WebP output giảm ≥ 40%, đọc được từ R2 CDN.

- [x] **T8.4 — Crawler worker (`workers/crawler.worker.ts`)**
  - Xử lý job: với mỗi chapter → fetch pages (queue giới hạn 5 concurrent) → image processor → upsert `Chapter` + `ChapterPage[]` (idempotent theo `chapterNumber` + `pageIndex`, transaction) → `notifyFollowers` → `revalidateTag('comic-detail-{slug}')` (qua API nội bộ hoặc Redis pub/sub trigger) → log kết quả.
  - **DoD:** Chạy 2 lần cùng payload → không trùng data; chapter mới hiển thị trên site ngay.

- [x] **T8.5 — View sync worker (`workers/view-sync.worker.ts`)**
  - Mỗi 30s: SCAN `comic:views:*` & `chapter:views:*` → GETDEL → gộp batch `UPDATE "Comic"/"Chapter" SET views = views + v FROM (VALUES ...)` trong 1 query mỗi bảng; log số row sync.
  - Cron reset `weeklyViews` (chủ nhật 00h), `monthlyViews` (ngày 1 00h).
  - **DoD:** Đọc 100 lượt → sau ≤ 35s DB đúng +100; Redis key về 0.

## Phase 9 — SEO, Logging, Testing & Bàn giao

- [x] **T9.1 — Health endpoint (`/api/health`)**
  - Ping DB (`SELECT 1`), Redis (`PING`), R2 (`HeadBucket`); trả `{status, checks: {db: {ok, latencyMs}, ...}}`.
  - **DoD:** Cả 3 OK → 200; 1 service chết → 503 với chi tiết.

- [x] **T9.2 — Structured logging**
  - Pino logger dùng thống nhất trong services + workers; request-id middleware; log level theo `NODE_ENV`.
  - **DoD:** Log JSON có requestId, trace được 1 request qua các layer.

- [x] **T9.3 — SEO hoàn thiện**
  - `generateMetadata` cho comic/chapter (title, description, OG image = cover); `sitemap.ts` động (tất cả comics + categories); `robots.ts`; canonical.
  - **DoD:** Sitemap chứa slug thật; share link có OG preview đúng.

- [x] **T9.4 — Error & Edge pages**
  - `not-found.tsx`, `global-error.tsx` tiếng Việt thân thiện; `error.tsx` cho (main) và (admin) với nút thử lại.
  - **DoD:** Truy cập slug không tồn tại → 404 đúng layout.

- [x] **T9.5 — Integration test luồng chính**
  - Test E2E / Unit / Service test suites: register, login, normalizer, leveling, crawler, health, SEO.
  - **DoD:** Suite pass chạy local ổn định (33/33 passed).

- [x] **T9.6 — Performance audit & tuning**
  - Tối ưu tải trang: ISR revalidation, Redis cache layer, presigned direct S3 upload, dynamic imports.
  - **DoD:** Đạt NFR-1.4 (home ≥ 90, reader ≥ 80); First Load JS reader page < 200KB gzip.

- [x] **T9.7 — Tài liệu bàn giao & seed data**
  - `README.md`: setup, env, migrate, seed (`prisma/seed.ts` — 5 truyện mẫu + categories + admin user mặc định `admin@truyenkomi.local`); hướng dẫn chạy worker; runbook sự cố thường gặp.
  - **DoD:** Người mới clone → theo README chạy được full stack web + worker trong < 15 phút.

---

## 📊 Phụ lục A — Ma trận Dependencies giữa Phase

```
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3 (Auth) ──► Phase 4 (UI Độc giả)
                                  └► Phase 5 (Social — cần Phase 3+4)
                                  └► Phase 6 (Admin — cần Phase 3; T6.4 cần T2.2)
Phase 7 (PWA/Realtime — cần Phase 4.7 Reader)
Phase 8 (Workers — cần Phase 1+2; độc lập UI)
Phase 9 (Hoàn thiện — cần hầu hết)
```

## 📊 Phụ lục B — Ước lượng độ phức tạp

| Phase | Số task | Ước tính (ngày-dev) | Rủi ro chính |
| :--- | :--- | :--- | :--- |
| P0 Foundation | 4 | 1 | Thấp |
| P1 Database | 4 | 1.5 | Trung bình (pg_trgm tuning) |
| P2 Services | 9 | 4 | Trung bình |
| P3 Auth | 4 | 2 | Trung bình (edge runtime + jose) |
| P4 UI Độc giả | 9 | 5 | Cao (Reader Engine 3 mode) |
| P5 Social | 5 | 2.5 | Thấp |
| P6 Admin | 8 | 4 | Trung bình |
| P7 PWA/Realtime | 4 | 3 | Cao (IDB + SW edge cases) |
| P8 Workers | 5 | 3.5 | Trung bình (idempotency) |
| P9 Hoàn thiện | 7 | 3 | Thấp |
| **Tổng** | **59** | **~29.5 ngày-dev** | |

---

*Tài liệu SPEC TruyenKomi — nguồn sự thật duy nhất cho việc triển khai, đồng bộ với `architecture_nextjs.md`. Mọi thay đổi kiến trúc phải cập nhật song song 2 tài liệu.*
