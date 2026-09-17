"use client";

import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { ImageUploader } from "./ImageUploader";
import { upsertChapterAction } from "@/actions/comic.actions";
import { toast } from "@/stores/toast-store";
import { Loader2 } from "lucide-react";

export interface ChapterFormData {
  id?: string;
  comicId: string;
  chapterNumber: number;
  title?: string;
  pages: string[];
}

export interface ChapterModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  comicId: string;
  comicTitle: string;
  initialData?: ChapterFormData | null;
}

export function ChapterModalForm({
  isOpen,
  onClose,
  comicId,
  comicTitle,
  initialData,
}: ChapterModalFormProps) {
  const [isPending, startTransition] = useTransition();

  const [chapterNumber, setChapterNumber] = useState<number | string>(
    initialData?.chapterNumber !== undefined ? initialData.chapterNumber : ""
  );
  const [title, setTitle] = useState(initialData?.title || "");
  const [pages, setPages] = useState<string[]>(initialData?.pages || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const num = parseFloat(String(chapterNumber));
    if (isNaN(num) || num < 0) {
      toast.warning("Vui lòng nhập số chương hợp lệ (VD: 1, 2, 2.5)!");
      return;
    }

    if (pages.length === 0) {
      toast.warning("Vui lòng tải lên ít nhất 1 trang ảnh cho chương này!");
      return;
    }

    const pagesPayload = pages.map((url, idx) => ({
      pageIndex: idx,
      imageUrl: url,
    }));

    const formData = new FormData();
    if (initialData?.id) formData.append("id", initialData.id);
    formData.append("comicId", comicId);
    formData.append("chapterNumber", num.toString());
    if (title.trim()) formData.append("title", title.trim());
    formData.append("pages", JSON.stringify(pagesPayload));

    startTransition(async () => {
      try {
        const res = await upsertChapterAction(null, formData);
        if (res.ok) {
          toast.success(
            initialData?.id
              ? `Đã cập nhật chương ${num}! ✅`
              : `Đã đăng chương ${num} thành công! 🎉`
          );
          onClose();
        } else {
          toast.error(res.error || "Không thể lưu chương");
        }
      } catch {
        toast.error("Có lỗi xảy ra khi lưu chương");
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        initialData?.id
          ? `Chỉnh Sửa Chương ${initialData.chapterNumber} — ${comicTitle}`
          : `Thêm Chương Mới — ${comicTitle}`
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[80vh] overflow-y-auto pr-1 py-1">
        {/* Chapter Number & Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Số thứ tự chương <span className="text-orange-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              value={chapterNumber}
              onChange={(e) => setChapterNumber(e.target.value)}
              placeholder="VD: 1, 2, 2.5, 100..."
              className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Tên / Tiêu đề chương (Tùy chọn)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Khởi đầu mới, Đại chiến..."
              className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Multi-page Image Uploader */}
        <div>
          <ImageUploader
            label={`Danh sách trang ảnh (${pages.length} trang) *`}
            multiple={true}
            folder="chapters"
            value={pages}
            onChange={(urls) => setPages(urls as string[])}
            helperText="Kéo thả hoặc chọn nhiều ảnh cùng lúc. Bạn có thể bấm nút mũi tên để đổi thứ tự trang."
          />
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 transition cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...
              </>
            ) : initialData?.id ? (
              "Lưu thay đổi"
            ) : (
              "Đăng chương mới"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
