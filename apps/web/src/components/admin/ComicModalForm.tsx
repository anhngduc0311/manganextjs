"use client";

import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { ImageUploader } from "./ImageUploader";
import { upsertComicAction } from "@/actions/comic.actions";
import { toSlug } from "@/lib/text-normalizer";
import { toast } from "@/stores/toast-store";
import { Loader2 } from "lucide-react";
import type { CategoryDTO } from "@/types";

export interface ComicFormData {
  id?: string;
  title: string;
  slug?: string;
  otherNames?: string;
  author?: string;
  status: "ONGOING" | "COMPLETED" | "DROPPED";
  coverImage: string;
  bannerImage?: string;
  description?: string;
  categoryIds: string[];
}

export interface ComicModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryDTO[];
  initialData?: ComicFormData | null;
}

export function ComicModalForm({
  isOpen,
  onClose,
  categories,
  initialData,
}: ComicModalFormProps) {
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [isSlugCustom, setIsSlugCustom] = useState(false);
  const [otherNames, setOtherNames] = useState(initialData?.otherNames || "");
  const [author, setAuthor] = useState(initialData?.author || "");
  const [status, setStatus] = useState<"ONGOING" | "COMPLETED" | "DROPPED">(
    initialData?.status || "ONGOING"
  );
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "");
  const [bannerImage, setBannerImage] = useState(initialData?.bannerImage || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialData?.categoryIds || []
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isSlugCustom && !initialData?.id) {
      setSlug(toSlug(val));
    }
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.warning("Vui lòng nhập tên truyện!");
      return;
    }
    if (!coverImage.trim()) {
      toast.warning("Vui lòng tải lên ảnh bìa truyện!");
      return;
    }

    const formData = new FormData();
    if (initialData?.id) formData.append("id", initialData.id);
    formData.append("title", title.trim());
    if (slug.trim()) formData.append("slug", slug.trim());
    if (otherNames.trim()) formData.append("otherNames", otherNames.trim());
    if (author.trim()) formData.append("author", author.trim());
    formData.append("status", status);
    formData.append("coverImage", coverImage.trim());
    if (bannerImage.trim()) formData.append("bannerImage", bannerImage.trim());
    if (description.trim()) formData.append("description", description.trim());
    selectedCategoryIds.forEach((id) => formData.append("categoryIds", id));

    startTransition(async () => {
      try {
        const res = await upsertComicAction(null, formData);
        if (res.ok) {
          toast.success(initialData?.id ? "Đã cập nhật thông tin truyện! ✅" : "Đã tạo truyện mới thành công! 🎉");
          onClose();
        } else {
          toast.error(res.error || "Không thể lưu thông tin truyện");
        }
      } catch {
        toast.error("Có lỗi xảy ra trong quá trình lưu dữ liệu");
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? "Chỉnh Sửa Bộ Truyện" : "Thêm Bộ Truyện Mới"}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[80vh] overflow-y-auto pr-1 py-1">
        {/* Title and Slug */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Tên truyện <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={handleTitleChange}
              placeholder="VD: One Piece, Solo Leveling..."
              className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Đường dẫn tĩnh (Slug)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setIsSlugCustom(true);
              }}
              placeholder="Tự động tạo nếu để trống..."
              className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Other names & Author */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Tên gọi khác
            </label>
            <input
              type="text"
              value={otherNames}
              onChange={(e) => setOtherNames(e.target.value)}
              placeholder="VD: Đảo Hải Tặc, Vua Hải Tặc..."
              className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Tác giả / Họa sĩ
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="VD: Eiichiro Oda, Chugong..."
              className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Trạng thái phát hành
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ComicFormData["status"])}
            className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-3 py-2.5 text-xs font-semibold text-zinc-100 outline-none focus:border-orange-500"
          >
            <option value="ONGOING">Đang tiến hành (ONGOING)</option>
            <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
            <option value="DROPPED">Tạm ngưng (DROPPED)</option>
          </select>
        </div>

        {/* Categories Checklist */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Thể loại truyện ({selectedCategoryIds.length} đã chọn)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            {categories.map((cat) => {
              const checked = selectedCategoryIds.includes(cat.id);
              return (
                <label
                  key={cat.id}
                  className={`flex items-center gap-2 rounded-lg p-1.5 text-xs transition cursor-pointer ${
                    checked
                      ? "bg-orange-500/15 text-orange-400 font-semibold"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(cat.id)}
                    className="accent-orange-500 rounded"
                  />
                  <span className="truncate">{cat.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Cover Image Uploader */}
        <div>
          <ImageUploader
            label="Ảnh bìa truyện (Cover Image) *"
            folder="covers"
            value={coverImage}
            onChange={(url) => setCoverImage(url as string)}
            helperText="Khuyên dùng tỷ lệ 3:4 (VD: 600x800 px)"
          />
        </div>

        {/* Banner Image Uploader */}
        <div>
          <ImageUploader
            label="Ảnh banner nền (Banner Image - Tùy chọn)"
            folder="banners"
            value={bannerImage}
            onChange={(url) => setBannerImage(url as string)}
            helperText="Khuyên dùng ảnh ngang tỷ lệ 16:9 (VD: 1920x1080 px)"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Tóm tắt nội dung
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập phần giới thiệu tóm tắt cốt truyện..."
            className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 p-3 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-orange-500 resize-none"
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
              "Tạo bộ truyện"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
