# 📋 Kế Hoạch Cải Thiện & Nâng Cấp Dự Án TruyenKomi (Next.js Fullstack)

Tài liệu này tổng hợp toàn bộ danh sách các tác vụ (tasks) cần thực hiện để vá lỗi nghiêm trọng, tối ưu hóa hiệu năng, tăng cường bảo mật và nâng cao trải nghiệm người dùng cho hệ thống **TruyenKomi**.

---

## 🎯 Tổng Quan Tiến Độ & Phân Loại Ưu Tiên

- [x] **Phase 1: Khắc Phục Lỗi Nghiêm Trọng & Rò Rỉ Tài Nguyên (P0 - Critical)** *(Hoàn thành)*
- [ ] **Phase 2: Nâng Cấp Bảo Mật & Xác Thực (P1 - High)**
- [x] **Phase 3: Tối Ưu Hóa Hiệu Năng & Cơ Sở Dữ Liệu (P2 - Medium)** *(Hoàn thành)*
- [ ] **Phase 4: Nâng Cấp Tính Năng Đọc Truyện & Trải Nghiệm Người Dùng (P2 - Medium)**
- [ ] **Phase 5: DevOps, Giám Sát & Kiểm Thử Hệ Thống (P3 - Low)**

---

## 🔴 Phase 1: Khắc Phục Lỗi Nghiêm Trọng & Rò Rỉ Tài Nguyên (P0 - Khẩn cấp)

> *Mục tiêu: Đảm bảo hệ thống không bị crash, rò rỉ kết nối database hoặc mất mát dữ liệu khi chạy trong môi trường Production.*

- [x] **Task 1.1: Sửa lỗi Prisma Connection Leak trong Production**
  - **File:** [`src/lib/prisma.ts`](file:///d:/Project/manganextjs/src/lib/prisma.ts)
  - **Mô tả:** Đảm bảo `PrismaClient` và `pg.Pool` được lưu trữ singleton chuẩn xác cho cả môi trường Production và Development. Tránh việc Proxy tạo instance `new Pool()` và `new PrismaClient()` trên mỗi lượt truy vấn.
  - **Tiêu chuẩn hoàn thành (DoD):** Cùng 1 instance Prisma & Pool duy nhất được tái sử dụng qua toàn bộ vòng đời của server process.

- [x] **Task 1.2: Tái cấu trúc cơ chế đếm lượt xem (View Counting Architecture)**
  - **File:** [`src/services/chapter.service.ts`](file:///d:/Project/manganextjs/src/services/chapter.service.ts), [`src/app/(main)/comics/[slug]/[chapter]/page.tsx`](file:///d:/Project/manganextjs/src/app/(main)/comics/[slug]/[chapter]/page.tsx), [`src/app/api/views/route.ts`](file:///d:/Project/manganextjs/src/app/api/views/route.ts)
  - **Mô tả:**
    - Xóa bỏ lệnh `cacheService.incrView()` bên trong `unstable_cache` của hàm `getReaderData()`.
    - Tạo API route hoặc Server Action `POST /api/views` để Client-side ghi nhận lượt xem.
    - Phía Client: Kích hoạt ghi nhận view sau khi người dùng đã đọc tối thiểu 5-10 giây hoặc lướt qua từ 2 trang trở lên (sử dụng debounce / beacon để chống spam bot).
  - **Tiêu chuẩn hoàn thành (DoD):** Cache hit vẫn phục vụ trang nhanh mà số lượt view vẫn được ghi nhận chính xác vào Redis; `generateMetadata` không làm tăng view ảo.

- [x] **Task 1.3: Khắc phục Race Condition trong View Sync Worker**
  - **File:** [`workers/view-sync.worker.ts`](file:///d:/Project/manganextjs/workers/view-sync.worker.ts)
  - **Mô tả:** Thay thế cặp lệnh rời rạc `redisRest.get()` + `redisRest.del()` bằng thao tác nguyên tử `GETDEL` (hoặc chuyển sang cấu trúc Redis Hash `HINCRBY` / atomic pipeline) để không làm mất lượt xem phát sinh đồng thời.
  - **Tiêu chuẩn hoàn thành (DoD):** Khi tải lượt xem liên tục trong lúc worker đang sync, không có lượt xem nào bị xóa mất.

- [x] **Task 1.4: Xử lý fallback cho Crawler Ingest API khi ngắt kết nối BullMQ**
  - **File:** [`src/app/api/crawler/ingest/route.ts`](file:///d:/Project/manganextjs/src/app/api/crawler/ingest/route.ts)
  - **Mô tả:** Nếu `ingestQueue` không kết nối được với Redis TCP, không được âm thầm trả về `{ ok: true }`. Cần trả về `HTTP 503 Service Unavailable` hoặc kích hoạt chế độ xử lý đồng bộ trực tiếp (`processChapterJob`).
  - **Tiêu chuẩn hoàn thành (DoD):** API không đánh lừa crawler bên ngoài khi hàng đợi chưa sẵn sàng.

---

## 🟠 Phase 2: Nâng Cấp Bảo Mật & Xác Thực (P1 - Độ ưu tiên cao)

> *Mục tiêu: Đóng các lỗ hổng bảo mật, ngăn chặn spam và hoàn thiện luồng người dùng.*

- [ ] **Task 2.1: Thêm bảng `CommentLike` để chặn Spam Like bình luận**
  - **File:** [`prisma/schema.prisma`](file:///d:/Project/manganextjs/prisma/schema.prisma), [`src/services/comment.service.ts`](file:///d:/Project/manganextjs/src/services/comment.service.ts), [`src/actions/comment.actions.ts`](file:///d:/Project/manganextjs/src/actions/comment.actions.ts)
  - **Mô tả:**
    - Thêm model `CommentLike` với khóa chính tổng hợp `@@id([userId, commentId])`.
    - Cập nhật logic: 1 người dùng chỉ có thể Like 1 lần (bấm lại sẽ Unlike).
  - **Tiêu chuẩn hoàn thành (DoD):** Người dùng không thể spam tăng like vô hạn cho bình luận.

- [ ] **Task 2.2: Cho phép người dùng tự xóa bình luận của chính mình**
  - **File:** [`src/actions/comment.actions.ts`](file:///d:/Project/manganextjs/src/actions/comment.actions.ts), [`src/services/comment.service.ts`](file:///d:/Project/manganextjs/src/services/comment.service.ts)
  - **Mô tả:** Bổ sung điều kiện trong `deleteCommentAction`: Cho phép thực hiện nếu `session.user.id === comment.userId` hoặc người dùng có role `ADMIN`/`MODERATOR`.
  - **Tiêu chuẩn hoàn thành (DoD):** Tác giả bình luận có quyền tự xóa comment của mình.


- [ ] **Task 2.4: Tối ưu tải kết nối Realtime SSE**
  - **File:** [`src/app/api/realtime/sse/route.ts`](file:///d:/Project/manganextjs/src/app/api/realtime/sse/route.ts)
  - **Mô tả:** Giảm tần suất ping Redis từ 4s lên 15s hoặc chuyển sang kênh Redis Pub/Sub tập trung thay vì mỗi client mở 1 `setInterval` gửi truy vấn trực tiếp.
  - **Tiêu chuẩn hoàn thành (DoD):** Giảm tải 70-80% số lượng request đến Redis khi có hàng nghìn kết nối đồng thời.

---

## 🟡 Phase 3: Tối Ưu Hóa Hiệu Năng & Cơ Sở Dữ Liệu (P2 - Trung bình)

> *Mục tiêu: Đạt chỉ số Core Web Vitals tối ưu, giảm thời gian phản hồi TTFB < 100ms.*

- [x] **Task 3.1: Khử Subquery N+1 trên bảng Comic**
  - **File:** [`prisma/schema.prisma`](file:///d:/Project/manganextjs/prisma/schema.prisma), [`src/services/comic.service.ts`](file:///d:/Project/manganextjs/src/services/comic.service.ts), [`workers/crawler.worker.ts`](file:///d:/Project/manganextjs/workers/crawler.worker.ts)
  - **Mô tả:**
    - Bổ sung trường `latestChapterNumber Float?` và `chapterCount Int @default(0)` vào bảng `Comic`.
    - Cập nhật các trường này trong transaction khi nạp/thêm chapter mới.
    - Thay thế subquery `chapters: { orderBy: { chapterNumber: 'desc' }, take: 1 }` bằng việc đọc trực tiếp 2 trường đã được index.
  - **Tiêu chuẩn hoàn thành (DoD):** Thời gian query trang danh sách truyện và trang chủ giảm từ ~50ms xuống < 10ms.

- [x] **Task 3.2: Sửa và đồng bộ Cache Revalidation Path/Tag**
  - **File:** [`src/actions/comment.actions.ts`](file:///d:/Project/manganextjs/src/actions/comment.actions.ts), [`src/actions/comic.actions.ts`](file:///d:/Project/manganextjs/src/actions/comic.actions.ts)
  - **Mô tả:**
    - Sau khi bình luận, revalidate chính xác `revalidatePath('/comics', 'layout')` và tag `comments-${comicId}`.
    - Đảm bảo bình luận hiển thị tức thì sau khi submit mà không cần hard reload.
  - **Tiêu chuẩn hoàn thành (DoD):** Bình luận và số lượt thích được cập nhật ngay lập tức.

- [x] **Task 3.3: Tối ưu Service Worker cho Next.js 15 App Router RSC**
  - **File:** [`public/sw.js`](file:///d:/Project/manganextjs/public/sw.js)
  - **Mô tả:** Xử lý đúng các request RSC (`?_rsc=...` hoặc header `RSC: 1`) với chiến lược Stale-While-Revalidate hoặc Network-First có fallback an toàn, tránh lỗi trắng trang khi mất kết nối mạng chập chờn.
  - **Tiêu chuẩn hoàn thành (DoD):** Ứng dụng PWA chuyển trang mượt mà cả khi mạng yếu hoặc offline.

---

## 🟢 Phase 4: Nâng Cấp Tính Năng Đọc Truyện & Trải Nghiệm Người Dùng (P2 - Trung bình)

> *Mục tiêu: Đưa trải nghiệm đọc truyện lên tầm cao cấp (Premium UI/UX).*

- [ ] **Task 4.1: Thêm cơ chế Smart Image Preloading trong Reader**
  - **File:** [`src/components/reader/WebtoonReader.tsx`](file:///d:/Project/manganextjs/src/components/reader/WebtoonReader.tsx)
  - **Mô tả:**
    - Sử dụng `IntersectionObserver` để prefetch trước 3-5 trang ảnh tiếp theo trước khi người dùng cuộn đến vị trí đó.
    - Hiển thị Skeleton loader / Blur placeholder mượt mà trong lúc tải ảnh.
  - **Tiêu chuẩn hoàn thành (DoD):** Không còn hiện tượng giật cục hay hình ảnh tải chậm khi độc giả lướt nhanh.

- [ ] **Task 4.2: Prefetch chương tiếp theo (Next Chapter Prefetching)**
  - **File:** [`src/components/reader/ReaderView.tsx`](file:///d:/Project/manganextjs/src/components/reader/ReaderView.tsx)
  - **Mô tả:** Khi người đọc cuộn đến 80% thời lượng của chương hiện tại, tự động gọi `router.prefetch()` cho link chương tiếp theo và tải trước 2 trang đầu của chương sau vào bộ nhớ đệm trình duyệt.
  - **Tiêu chuẩn hoàn thành (DoD):** Bấm "Chương tiếp" chuyển trang tức thì (0 delay).

- [ ] **Task 4.3: Hoàn thiện tính năng Tải Truyện Đọc Offline (IndexedDB Downloader)**
  - **File:** [`src/components/reader/ReaderToolbar.tsx`](file:///d:/Project/manganextjs/src/components/reader/ReaderToolbar.tsx), [`src/app/(main)/offline/page.tsx`](file:///d:/Project/manganextjs/src/app/(main)/offline/page.tsx)
  - **Mô tả:**
    - Thêm nút "Tải chương" trên thanh toolbar của Reader.
    - Lưu toàn bộ danh sách ảnh Blob của chương vào IndexedDB thông qua thư viện `idb`.
    - Hiển thị danh sách các chương đã tải trong Tủ Truyện Offline (`/offline`) và cho phép đọc offline 100%.
  - **Tiêu chuẩn hoàn thành (DoD):** Tắt mạng hoàn toàn vẫn đọc được các chương đã tải về trước đó.

- [ ] **Task 4.4: Thông báo Realtime In-App Notification Badge**
  - **File:** [`src/components/common/NotificationDropdown.tsx`](file:///d:/Project/manganextjs/src/components/common/NotificationDropdown.tsx), [`src/components/common/Navbar.tsx`](file:///d:/Project/manganextjs/src/components/common/Navbar.tsx)
  - **Mô tả:** Hiển thị chấm đỏ số lượng thông báo chưa đọc trên icon quả chuông, cập nhật ngay khi có chapter mới của truyện đang follow hoặc có người trả lời bình luận.
  - **Tiêu chuẩn hoàn thành (DoD):** Dropdown hiển thị thông báo mới nhất và đánh dấu đã đọc mượt mà.

- [ ] **Task 4.5: Xây dựng giao diện Quản lý Báo cáo lỗi (Admin Report Dashboard)**
  - **File:** [`src/app/(admin)/admin/reports/page.tsx`](file:///d:/Project/manganextjs/src/app/(admin)/admin/reports/page.tsx), [`src/actions/report.actions.ts`](file:///d:/Project/manganextjs/src/actions/report.actions.ts)
  - **Mô tả:** Tạo trang danh sách báo cáo lỗi chương (ảnh hỏng, trùng chương, nội dung sai...) cho Admin/Mod với tính năng lọc trạng thái, xử lý và xóa báo cáo.
  - **Tiêu chuẩn hoàn thành (DoD):** Admin có thể dễ dàng tiếp nhận và xử lý phản ánh của độc giả.

---

## 🔵 Phase 5: DevOps, Giám Sát & Kiểm Thử Hệ Thống (P3 - Mở rộng)

> *Mục tiêu: Đảm bảo tính ổn định lâu dài và chất lượng mã nguồn khi mở rộng.*

- [ ] **Task 5.1: Cấu hình GitHub Actions CI Workflow**
  - **File:** [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml)
  - **Mô tả:** Tự động chạy quy trình kiểm tra mã nguồn:
    1. `npm run lint`
    2. `npx tsc --noEmit`
    3. `npm run test` (Vitest)
    4. `npm run build`
  - **Tiêu chuẩn hoàn thành (DoD):** Mọi pull request đều phải vượt qua toàn bộ test trước khi merge.

- [ ] **Task 5.2: Tích hợp Giám sát Lỗi (Error Monitoring - Sentry / Pino log shipper)**
  - **File:** [`src/lib/logger.ts`](file:///d:/Project/manganextjs/src/lib/logger.ts), [`src/app/global-error.tsx`](file:///d:/Project/manganextjs/src/app/global-error.tsx)
  - **Mô tả:** Bắt và gửi thông báo lỗi ngoại lệ (Unhandled Exceptions) trên Production về Telegram Bot / Sentry / Discord Webhook.
  - **Tiêu chuẩn hoàn thành (DoD):** Lỗi crash hoặc crawler fail được cảnh báo ngay lập tức cho đội ngũ vận hành.

- [ ] **Task 5.3: Bổ sung Test Coverage cho các luồng quan trọng**
  - **File:** [`src/lib/__tests__/`](file:///d:/Project/manganextjs/src/lib/__tests__/)
  - **Mô tả:** Viết unit & integration tests cho:
    - `chapter.service.ts` & `comic.service.ts`
    - `comment.actions.ts` & `comic.actions.ts`
    - `crawler.worker.ts` & `image-processor.ts`
  - **Tiêu chuẩn hoàn thành (DoD):** Tỷ lệ bao phủ kiểm thử (Test coverage) đạt > 70% cho core services.

---

*File này được tạo tự động bởi Antigravity Assistant. Hãy đánh dấu `[x]` khi hoàn thành từng tác vụ.*
