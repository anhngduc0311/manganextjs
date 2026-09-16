"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Eye,
  Star,
  ExternalLink,
  Filter,
  RefreshCw,
} from "lucide-react";
import { ComicModalForm, type ComicFormData } from "./ComicModalForm";
import { deleteComicAction, scanMangaDexUpdatesAction } from "@/actions/comic.actions";
import { toast } from "@/stores/toast-store";
import type { CategoryDTO } from "@/types";

export interface ComicRow {
  id: string;
  title: string;
  slug: string;
  otherNames: string | null;
  author: string | null;
  status: "ONGOING" | "COMPLETED" | "DROPPED";
  coverImage: string;
  bannerImage: string | null;
  description: string | null;
  views: number;
  ratingAvg: number;
  ratingCount: number;
  chapterCount: number;
  updatedAt: string;
  categories: Array<{ id: string; name: string }>;
}

export interface ComicsTableProps {
  initialComics: ComicRow[];
  categories: CategoryDTO[];
}

export function ComicsTable({ initialComics, categories }: ComicsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingComic, setEditingComic] = useState<ComicFormData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isScanning, setIsScanning] = useState(false);

  const filtered = initialComics.filter((c) => {
    const matchSearch =
      !search.trim() ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      (c.author && c.author.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenCreate = () => {
    setEditingComic(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (c: ComicRow) => {
    setEditingComic({
      id: c.id,
      title: c.title,
      slug: c.slug,
      otherNames: c.otherNames || "",
      author: c.author || "",
      status: c.status,
      coverImage: c.coverImage,
      bannerImage: c.bannerImage || "",
      description: c.description || "",
      categoryIds: c.categories.map((cat) => cat.id),
    });
    setModalOpen(true);
  };

  const handleScanUpdates = async () => {
    if (isScanning) return;
    setIsScanning(true);
    toast.info("Đang quét cập nhật mới từ MangaDex (20 truyện mới nhất)...");

    try {
      const res = await scanMangaDexUpdatesAction(20);
      if (res.ok && res.data) {
        if (res.data.newChaptersCount > 0) {
          toast.success(`Đã nạp ${res.data.newChaptersCount} chương mới từ ${res.data.updatedCount} bộ truyện!`);
        } else {
          toast.success(`Đã quét xong ${res.data.scannedCount} truyện: Tất cả đều đã ở phiên bản mới nhất!`);
        }
      } else {
        toast.error(res.error || "Không thể quét cập nhật lúc này");
      }
    } catch {
      toast.error("Lỗi khi quét cập nhật từ MangaDex");
    } finally {
      setIsScanning(false);
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bộ truyện "${title}" không? Hành động này sẽ xóa toàn bộ các chương liên quan!`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteComicAction(id);
        if (res.ok) {
          toast.success(`Đã xóa bộ truyện "${title}" thành công!`);
        } else {
          toast.error(res.error || "Không thể xóa truyện");
        }
      } catch {
        toast.error("Lỗi khi xóa bộ truyện");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên truyện, tác giả, slug..."
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-orange-500 transition"
            />
          </div>

          {/* Status Filter */}
          <div className="relative shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 text-xs font-semibold text-zinc-300 outline-none focus:border-orange-500 transition"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ONGOING">Đang tiến hành</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="DROPPED">Tạm ngưng</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleScanUpdates}
            disabled={isScanning}
            className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800/90 px-4 py-2.5 text-xs font-bold text-zinc-200 shadow-md hover:bg-zinc-700 hover:text-white transition cursor-pointer disabled:opacity-50"
            title="Quét các truyện vừa có chương mới trên MangaDex và nạp chương mới vào hệ thống"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-orange-400 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "Đang quét MangaDex..." : "Quét truyện mới cập nhật"}
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Thêm truyện mới
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-4">Truyện</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Thể loại</th>
                <th className="py-3.5 px-4">Số chương</th>
                <th className="py-3.5 px-4">Lượt xem</th>
                <th className="py-3.5 px-4">Đánh giá</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    Không tìm thấy bộ truyện nào phù hợp
                  </td>
                </tr>
              ) : (
                filtered.map((comic) => (
                  <tr key={comic.id} className="hover:bg-zinc-800/40 transition">
                    {/* Comic Cover & Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-800 shadow-md">
                          <Image
                            src={comic.coverImage || "/icons/icon-192.png"}
                            alt={comic.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="font-bold text-zinc-100 truncate">{comic.title}</p>
                          <p className="text-[11px] text-zinc-500 truncate">/{comic.slug}</p>
                          {comic.author && <p className="text-[10px] text-orange-400/80 truncate">TG: {comic.author}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                          comic.status === "ONGOING"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : comic.status === "COMPLETED"
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                            : "border-zinc-700 bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {comic.status}
                      </span>
                    </td>

                    {/* Categories */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {comic.categories.slice(0, 2).map((c) => (
                          <span key={c.id} className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400">
                            {c.name}
                          </span>
                        ))}
                        {comic.categories.length > 2 && (
                          <span className="text-[10px] text-zinc-500">+{comic.categories.length - 2}</span>
                        )}
                      </div>
                    </td>

                    {/* Chapters */}
                    <td className="py-3 px-4 font-semibold text-zinc-300">
                      <Link
                        href={`/admin/chapters?comicId=${comic.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-zinc-800/80 px-2 py-1 text-xs font-semibold text-zinc-300 hover:bg-orange-500/20 hover:text-orange-400 transition"
                      >
                        <Layers className="h-3 w-3" />
                        <span>{comic.chapterCount} chương</span>
                      </Link>
                    </td>

                    {/* Views */}
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-zinc-300">
                        <Eye className="h-3.5 w-3.5 text-zinc-500" />
                        {comic.views.toLocaleString()}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        {comic.ratingAvg.toFixed(1)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View in client */}
                        <Link
                          href={`/comics/${comic.slug}`}
                          target="_blank"
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
                          title="Xem trên trang độc giả"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(comic)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 hover:text-orange-400 hover:bg-orange-500/10 transition cursor-pointer"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(comic.id, comic.title)}
                          disabled={isPending}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer disabled:opacity-50"
                          title="Xóa bộ truyện"
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

      {/* Comic Modal Form (Create / Edit) */}
      <ComicModalForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        initialData={editingComic}
      />
    </div>
  );
}
