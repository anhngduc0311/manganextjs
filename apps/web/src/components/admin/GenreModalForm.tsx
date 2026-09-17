"use client";

import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { upsertGenreAction } from "@/actions/comic.actions";
import { toSlug } from "@/lib/text-normalizer";
import { toast } from "@/stores/toast-store";
import { Loader2 } from "lucide-react";

export interface GenreFormData {
  id?: string;
  name: string;
  slug?: string;
  description?: string;
}

export interface GenreModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: GenreFormData | null;
}

export function GenreModalForm({ isOpen, onClose, initialData }: GenreModalFormProps) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [isSlugCustom, setIsSlugCustom] = useState(false);
  const [description, setDescription] = useState(initialData?.description || "");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isSlugCustom && !initialData?.id) {
      setSlug(toSlug(val));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.warning("Vui lòng nhập tên thể loại!");
      return;
    }

    const formData = new FormData();
    if (initialData?.id) formData.append("id", initialData.id);
    formData.append("name", name.trim());
    if (slug.trim()) formData.append("slug", slug.trim());
    if (description.trim()) formData.append("description", description.trim());

    startTransition(async () => {
      try {
        const res = await upsertGenreAction(null, formData);
        if (res.ok) {
          toast.success(
            initialData?.id
              ? "Đã cập nhật thể loại thành công! ✅"
              : "Đã tạo thể loại mới thành công! 🎉"
          );
          onClose();
        } else {
          toast.error(res.error || "Không thể lưu thể loại");
        }
      } catch {
        toast.error("Lỗi khi lưu thể loại");
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? "Chỉnh Sửa Thể Loại" : "Thêm Thể Loại Mới"}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Tên thể loại <span className="text-orange-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={handleNameChange}
            placeholder="VD: Action, Romance, Isekai..."
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

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Mô tả chi tiết thể loại (Tùy chọn)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả đặc điểm thể loại này..."
            className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 p-3 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-orange-500 resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 transition cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...
              </>
            ) : initialData?.id ? (
              "Lưu thay đổi"
            ) : (
              "Tạo thể loại"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
