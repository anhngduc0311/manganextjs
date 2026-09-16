"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { RatingStar } from "@/components/ui/RatingStar";
import { ToastContainer } from "@/components/ui/Toast";
import { toast } from "@/stores/toast-store";
import { Search, Mail, Sparkles } from "lucide-react";

export default function UIDevPreviewPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [rateScore, setRateScore] = useState(4.5);
  const [page, setPage] = useState(1);

  return (
    <div className="mx-auto max-w-5xl space-y-12 p-8 text-zinc-100">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-3xl font-black text-orange-500 flex items-center gap-2">
          <Sparkles className="h-6 w-6" /> TruyenKomi Design System Preview
        </h1>
        <p className="mt-1 text-sm text-zinc-400">Trang kiểm thử trực quan tất cả UI Components (Phase 4 — T4.1)</p>
      </div>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">1. Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      {/* Inputs */}
      <section className="space-y-4 max-w-md">
        <h2 className="text-lg font-bold">2. Inputs</h2>
        <Input label="Email" placeholder="Nhập địa chỉ email..." leftIcon={<Mail className="h-4 w-4" />} />
        <Input label="Tìm kiếm" placeholder="Tìm truyện tranh..." leftIcon={<Search className="h-4 w-4" />} />
        <Input label="Input Lỗi" placeholder="Dữ liệu sai..." error="Email này không đúng định dạng!" />
      </section>

      {/* Select */}
      <section className="space-y-4 max-w-md">
        <h2 className="text-lg font-bold">3. Select</h2>
        <Select
          label="Sắp xếp"
          options={[
            { value: "views", label: "Lượt xem nhiều nhất" },
            { value: "updated", label: "Mới cập nhật" },
            { value: "rating", label: "Đánh giá cao" },
          ]}
        />
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">4. Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="primary">Primary (Hot)</Badge>
          <Badge variant="success">Success (Ongoing)</Badge>
          <Badge variant="warning">Warning (Chapter 10)</Badge>
          <Badge variant="danger">Danger (18+)</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      {/* Rating Star */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">5. Rating Star (Interactive)</h2>
        <div className="space-y-2">
          <RatingStar score={rateScore} count={1250} interactive onRate={setRateScore} size="lg" />
          <p className="text-xs text-zinc-400">Điểm hiện tại: {rateScore} sao (Click để thử đánh giá)</p>
        </div>
      </section>

      {/* Toasts */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">6. Toast Notifications</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toast.success("Đã lưu thành công!")}>
            Success Toast
          </Button>
          <Button variant="outline" onClick={() => toast.error("Đã xảy ra lỗi kết nối!")}>
            Error Toast
          </Button>
          <Button variant="outline" onClick={() => toast.info("Có 2 chương mới hôm nay!")}>
            Info Toast
          </Button>
          <Button variant="outline" onClick={() => toast.warning("Vui lòng đăng nhập trước!")}>
            Warning Toast
          </Button>
        </div>
      </section>

      {/* Skeletons */}
      <section className="space-y-4 max-w-sm">
        <h2 className="text-lg font-bold">7. Skeletons</h2>
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </section>

      {/* Modal */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">8. Modal Dialog</h2>
        <Button onClick={() => setModalOpen(true)}>Mở Modal Test</Button>
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Modal Xem Trước">
          <div className="space-y-4 text-xs text-zinc-300">
            <p>Đây là component Modal chuẩn với hiệu ứng backdrop-blur và phím tắt đóng linh hoạt.</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Đóng
              </Button>
              <Button size="sm" onClick={() => setModalOpen(false)}>
                Xác nhận
              </Button>
            </div>
          </div>
        </Modal>
      </section>

      {/* Pagination */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">9. Pagination</h2>
        <Pagination currentPage={page} totalPages={10} buildHref={(p) => `#page-${p}`} />
      </section>

      <ToastContainer />
    </div>
  );
}
