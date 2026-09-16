"use client";

import React, { useState, useTransition } from "react";
import { SafeImage } from "@/components/common/SafeImage";
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
  RefreshCw,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
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
  hasChapter1: boolean;
  firstChapterNumber: number | null;
  updatedAt: string;
  categories: Array<{ id: string; name: string }>;
}

export interface ComicsTableProps {
  initialComics: ComicRow[];
  categories: CategoryDTO[];
}

export function ComicsTable({ initialComics, categories }: ComicsTableProps) {
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingComic, setEditingComic] = useState<ComicFormData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isScanning, setIsScanning] = useState(false);

  // Counters
  const totalCount = initialComics.length;
  const missingCh1Count = initialComics.filter((c) => !c.hasChapter1 && c.chapterCount > 0).length;
  const zeroChapterCount = initialComics.filter((c) => c.chapterCount === 0).length;
  const hasCh1Count = initialComics.filter((c) => c.hasChapter1).length;
  const totalChapters = initialComics.reduce((sum, c) => sum + c.chapterCount, 0);

  const filtered = initialComics.filter((c) => {
    const matchSearch =
      !search.trim() ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      (c.author && c.author.toLowerCase().includes(search.toLowerCase()));

    let matchFilter = true;
    if (filterMode === "MISSING_CH1") {
      matchFilter = !c.hasChapter1 && c.chapterCount > 0;
    } else if (filterMode === "NO_CHAPTERS") {
      matchFilter = c.chapterCount === 0;
    } else if (filterMode === "HAS_CH1") {
      matchFilter = c.hasChapter1;
    } else if (filterMode === "ONGOING" || filterMode === "COMPLETED" || filterMode === "DROPPED") {
      matchFilter = c.status === filterMode;
    }

    return matchSearch && matchFilter;
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
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* All Comics */}
        <button
          onClick={() => setFilterMode("ALL")}
          className={`flex flex-col items-start p-3.5 rounded-2xl border transition text-left cursor-pointer ${
            filterMode === "ALL"
              ? "bg-zinc-800/90 border-orange-500/50 shadow-md shadow-orange-500/10"
              : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50"
          }`}
        >
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
            <BookOpen className="h-3.5 w-3.5 text-orange-400" />
            <span>Tổng số truyện</span>
          </div>
          <span className="text-xl font-black text-white mt-1.5">{totalCount}</span>
        </button>

        {/* Missing Chapter 1 (Highlight Filter) */}
        <button
          onClick={() => setFilterMode("MISSING_CH1")}
          className={`flex flex-col items-start p-3.5 rounded-2xl border transition text-left cursor-pointer ${
            filterMode === "MISSING_CH1"
              ? "bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/10"
              : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50"
          }`}
        >
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>Thiếu Chapter 1</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xl font-black text-amber-300">{missingCh1Count}</span>
            {missingCh1Count > 0 && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-bold">
                Cần bổ sung
              </span>
            )}
          </div>
        </button>

        {/* Has Chapter 1 */}
        <button
          onClick={() => setFilterMode("HAS_CH1")}
          className={`flex flex-col items-start p-3.5 rounded-2xl border transition text-left cursor-pointer ${
            filterMode === "HAS_CH1"
              ? "bg-emerald-500/15 border-emerald-500/60 shadow-md shadow-emerald-500/10"
              : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50"
          }`}
        >
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Đủ Chapter 1</span>
          </div>
          <span className="text-xl font-black text-emerald-300 mt-1.5">{hasCh1Count}</span>
        </button>

        {/* Total Chapters */}
        <div className="flex flex-col items-start p-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
            <Layers className="h-3.5 w-3.5 text-blue-400" />
            <span>Tổng số chương</span>
          </div>
          <span className="text-xl font-black text-white mt-1.5">{totalChapters.toLocaleString()}</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3">
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterMode("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              filterMode === "ALL"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            Tất cả ({totalCount})
          </button>

          <button
            onClick={() => setFilterMode("MISSING_CH1")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              filterMode === "MISSING_CH1"
                ? "bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/20"
                : "bg-zinc-800/80 text-amber-400 hover:bg-zinc-800 hover:text-amber-300"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Thiếu Chapter 1 ({missingCh1Count})</span>
          </button>

          <button
            onClick={() => setFilterMode("HAS_CH1")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              filterMode === "HAS_CH1"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            Đủ Chapter 1 ({hasCh1Count})
          </button>

          <button
            onClick={() => setFilterMode("NO_CHAPTERS")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              filterMode === "NO_CHAPTERS"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            0 chương ({zeroChapterCount})
          </button>

          <button
            onClick={() => setFilterMode("ONGOING")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              filterMode === "ONGOING"
                ? "bg-zinc-200 text-zinc-900"
                : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            Đang tiến hành
          </button>

          <button
            onClick={() => setFilterMode("COMPLETED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              filterMode === "COMPLETED"
                ? "bg-zinc-200 text-zinc-900"
                : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            Đã hoàn thành
          </button>
        </div>

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

            {/* Dropdown Filter */}
            <div className="relative shrink-0">
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="h-10 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 text-xs font-semibold text-zinc-300 outline-none focus:border-orange-500 transition"
              >
                <option value="ALL">Tất cả truyện</option>
                <option value="MISSING_CH1">⚠️ Thiếu Chapter 1</option>
                <option value="HAS_CH1">✓ Đủ Chapter 1</option>
                <option value="NO_CHAPTERS">Chưa có chương (0)</option>
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
                    Không tìm thấy bộ truyện nào phù hợp với bộ lọc hiện tại
                  </td>
                </tr>
              ) : (
                filtered.map((comic) => (
                  <tr key={comic.id} className="hover:bg-zinc-800/40 transition">
                    {/* Comic Cover & Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-800 shadow-md">
                          <SafeImage
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

                    {/* Chapters & Missing Chapter 1 Status */}
                    <td className="py-3 px-4 font-semibold">
                      <div className="flex flex-col items-start gap-1">
                        <Link
                          href={`/admin/chapters?comicId=${comic.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-zinc-800/80 px-2 py-1 text-xs font-semibold text-zinc-300 hover:bg-orange-500/20 hover:text-orange-400 transition"
                        >
                          <Layers className="h-3 w-3" />
                          <span>{comic.chapterCount} chương</span>
                        </Link>

                        {/* Badges for Missing Chapter 1 or Zero chapters */}
                        {!comic.hasChapter1 && comic.chapterCount > 0 ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-400"
                            title={`Truyện không có Chapter 1 trên hệ thống (Bắt đầu từ Chapter ${comic.firstChapterNumber})`}
                          >
                            <AlertTriangle className="h-2.5 w-2.5" />
                            <span>Thiếu Chap 1 {comic.firstChapterNumber ? `(từ #${comic.firstChapterNumber})` : ""}</span>
                          </span>
                        ) : comic.chapterCount === 0 ? (
                          <span className="inline-flex items-center rounded-md bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-bold text-rose-400">
                            Chưa có chương
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-400/80">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Có Chap 1
                          </span>
                        )}
                      </div>
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

