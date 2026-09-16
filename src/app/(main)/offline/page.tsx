"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Download, BookOpen, Trash2, HardDrive, Play } from "lucide-react";
import { useOfflineStorage, type OfflineChapterData } from "@/hooks/use-offline-storage";
import { toast } from "@/stores/toast-store";

export default function OfflinePage() {
  const { listOfflineChapters, removeOfflineChapter } = useOfflineStorage();
  const [chapters, setChapters] = useState<OfflineChapterData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listOfflineChapters().then((data) => {
      setChapters(data);
      setLoading(false);
    });
  }, [listOfflineChapters]);

  const handleDelete = async (chapterId: string) => {
    await removeOfflineChapter(chapterId);
    setChapters((prev) => prev.filter((c) => c.chapterId !== chapterId));
    toast.success("Đã xóa chương khỏi bộ nhớ offline!");
  };

  const totalPages = chapters.reduce((acc, c) => acc + (c.pages?.length || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-purple-500/10 via-zinc-900 to-zinc-900 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
          <Download className="h-4 w-4" /> Đọc truyện không cần mạng
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">Tủ Truyện Offline PWA</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          Các chương truyện đã được tải xuống và lưu trong bộ nhớ trình duyệt (IndexedDB). Bạn có thể thoải mái đọc
          ngay cả khi ngắt kết nối Internet.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-purple-400" />
          <span>
            Đã lưu <strong className="text-white font-bold">{chapters.length}</strong> chương (
            <strong className="text-purple-400 font-bold">{totalPages}</strong> trang ảnh)
          </span>
        </div>
        <span className="text-[11px] text-zinc-500">Dữ liệu được lưu trữ an toàn cục bộ trên thiết bị</span>
      </div>

      {/* Chapters List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-500">Đang nạp danh sách truyện offline...</div>
      ) : chapters.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
          <Download className="h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-sm font-semibold text-zinc-300">Chưa có chương truyện nào được tải về</p>
          <p className="mt-1 text-xs text-zinc-500">
            Khi đọc truyện, hãy bấm nút &quot;Tải offline&quot; trên thanh công cụ để lưu chương vào đây.
          </p>
          <Link
            href="/comics"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 transition"
          >
            <BookOpen className="h-4 w-4" /> Khám phá truyện
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map((c) => (
            <div
              key={c.chapterId}
              className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700"
            >
              <div>
                <Link
                  href={`/comics/${c.comicSlug}`}
                  className="truncate block text-sm font-bold text-zinc-100 hover:text-orange-400 transition"
                >
                  {c.comicTitle}
                </Link>
                <p className="mt-1 text-xs font-bold text-orange-400">Chương {c.chapterNumber}</p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {c.pages?.length || 0} trang • Tải ngày {new Date(c.savedAt).toLocaleDateString("vi-VN")}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-800/80">
                <Link
                  href={`/comics/${c.comicSlug}/chuong-${c.chapterNumber}`}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500/15 px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-500 hover:text-white transition"
                >
                  <Play className="h-3.5 w-3.5 fill-current" /> Đọc offline
                </Link>

                <button
                  onClick={() => handleDelete(c.chapterId)}
                  className="flex items-center gap-1 rounded-lg p-1.5 text-xs text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition cursor-pointer"
                  title="Xóa khỏi bộ nhớ offline"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
