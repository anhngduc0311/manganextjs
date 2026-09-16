"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  Eye,
  ExternalLink,
  BookOpen,
  Search,
} from "lucide-react";
import { ChapterModalForm, type ChapterFormData } from "./ChapterModalForm";
import { deleteChapterAction } from "@/actions/comic.actions";
import { toast } from "@/stores/toast-store";

export interface ComicOption {
  id: string;
  title: string;
  slug: string;
  chapterCount: number;
}

export interface ChapterRow {
  id: string;
  chapterNumber: number;
  title: string | null;
  views: number;
  pageCount: number;
  createdAt: string;
  pages: string[];
}

export interface ChaptersManagerProps {
  comics: ComicOption[];
  selectedComicId: string;
  chapters: ChapterRow[];
}

export function ChaptersManager({
  comics,
  selectedComicId,
  chapters,
}: ChaptersManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<ChapterFormData | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedComic = comics.find((c) => c.id === selectedComicId) || comics[0];

  const handleComicSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value;
    router.push(`/admin/chapters?comicId=${nextId}`);
  };

  const filtered = chapters.filter((ch) => {
    if (!search.trim()) return true;
    const numMatch = ch.chapterNumber.toString().includes(search.trim());
    const titleMatch = ch.title?.toLowerCase().includes(search.toLowerCase());
    return numMatch || titleMatch;
  });

  const handleOpenCreate = () => {
    if (!selectedComic) {
      toast.warning("Vui lòng tạo ít nhất 1 bộ truyện trước khi thêm chương!");
      return;
    }
    setEditingChapter(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (ch: ChapterRow) => {
    setEditingChapter({
      id: ch.id,
      comicId: selectedComic.id,
      chapterNumber: ch.chapterNumber,
      title: ch.title || "",
      pages: ch.pages,
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string, num: number) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa Chương ${num}? Tất cả các trang ảnh của chương này sẽ bị xóa!`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteChapterAction(id);
        if (res.ok) {
          toast.success(`Đã xóa Chương ${num} thành công!`);
        } else {
          toast.error(res.error || "Không thể xóa chương");
        }
      } catch {
        toast.error("Lỗi khi xóa chương");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Comic Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Comic Dropdown & Search */}
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <select
              value={selectedComic?.id || ""}
              onChange={handleComicSelect}
              className="w-full h-10 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-3.5 pr-8 text-xs font-bold text-orange-400 outline-none focus:border-orange-500 transition"
            >
              {comics.map((c) => (
                <option key={c.id} value={c.id} className="bg-zinc-950 text-zinc-100 font-medium">
                  {c.title} ({c.chapterCount} chương)
                </option>
              ))}
            </select>
          </div>

          <div className="relative shrink-0 w-48">
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm số chương..."
              className="w-full h-10 rounded-2xl border border-zinc-800 bg-zinc-900/80 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-orange-500 transition"
            />
          </div>
        </div>

        {/* Add Chapter Button */}
        {selectedComic && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" /> Đăng chương mới
          </button>
        )}
      </div>

      {/* Chapters Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-4">Số chương</th>
                <th className="py-3.5 px-4">Tiêu đề chương</th>
                <th className="py-3.5 px-4">Số trang ảnh</th>
                <th className="py-3.5 px-4">Lượt xem</th>
                <th className="py-3.5 px-4">Ngày đăng</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    {selectedComic
                      ? "Bộ truyện này chưa có chương nào được tạo."
                      : "Vui lòng chọn hoặc tạo một bộ truyện trước."}
                  </td>
                </tr>
              ) : (
                filtered.map((ch) => (
                  <tr key={ch.id} className="hover:bg-zinc-800/40 transition">
                    {/* Chapter Number */}
                    <td className="py-3 px-4 font-bold text-orange-400">
                      Chương {ch.chapterNumber}
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4 text-zinc-200">
                      {ch.title ? ch.title : <span className="text-zinc-500 italic">Không có tiêu đề</span>}
                    </td>

                    {/* Pages count */}
                    <td className="py-3 px-4 text-zinc-300">
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-300">
                        <Layers className="h-3 w-3 text-orange-400" /> {ch.pageCount} trang
                      </span>
                    </td>

                    {/* Views */}
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-zinc-300">
                        <Eye className="h-3.5 w-3.5 text-zinc-500" />
                        {ch.views.toLocaleString()}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-zinc-400 text-[11px]">
                      {new Date(ch.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View in Reader */}
                        {selectedComic && (
                          <Link
                            href={`/comics/${selectedComic.slug}/chuong-${ch.chapterNumber}`}
                            target="_blank"
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
                            title="Đọc thử chương này"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(ch)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 hover:text-orange-400 hover:bg-orange-500/10 transition cursor-pointer"
                          title="Chỉnh sửa chương"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(ch.id, ch.chapterNumber)}
                          disabled={isPending}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer disabled:opacity-50"
                          title="Xóa chương"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chapter Modal Form */}
      {selectedComic && (
        <ChapterModalForm
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          comicId={selectedComic.id}
          comicTitle={selectedComic.title}
          initialData={editingChapter}
        />
      )}
    </div>
  );
}
