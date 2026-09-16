"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Sliders, Download, MessageSquare, ArrowLeft, Check, Loader2, Flag, Users } from "lucide-react";
import { ReaderSettingsModal } from "./ReaderSettingsModal";
import { ReportModal } from "./ReportModal";
import { useOfflineStorage } from "@/hooks/use-offline-storage";
import { useLiveReaders } from "@/hooks/use-live-readers";
import { toast } from "@/stores/toast-store";
import type { ChapterDTO } from "@/types";

export interface ReaderToolbarProps {
  comicSlug: string;
  comicTitle: string;
  currentChapter: ChapterDTO;
  allChapters: ChapterDTO[];
  pageUrls?: string[];
}

export function ReaderToolbar({
  comicSlug,
  comicTitle,
  currentChapter,
  allChapters,
  pageUrls = [],
}: ReaderToolbarProps) {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const { downloading, downloadedIds, downloadChapter } = useOfflineStorage();
  const { liveCount } = useLiveReaders(currentChapter.id);


  const isDownloading = !!downloading[currentChapter.id];
  const downloadPercent = downloading[currentChapter.id] || 0;
  const isDownloaded = downloadedIds.has(currentChapter.id);

  // Find prev & next chapters
  const sorted = [...allChapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
  const currentIndex = sorted.findIndex((c) => c.id === currentChapter.id);
  const prevChapter = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const nextChapter = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;

  const handleChapterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetId = e.target.value;
    const target = allChapters.find((c) => c.id === targetId);
    if (target) {
      router.push(`/comics/${comicSlug}/chuong-${target.chapterNumber}`);
    }
  };

  const handleOfflineDownload = async () => {
    if (isDownloaded) {
      toast.info("Chương này đã được lưu trong tủ truyện offline!");
      return;
    }
    if (pageUrls.length === 0) {
      toast.warning("Không tìm thấy danh sách ảnh để tải");
      return;
    }

    try {
      toast.info("Bắt đầu tải chương để đọc offline...");
      await downloadChapter(
        currentChapter.id,
        comicSlug,
        comicTitle,
        currentChapter.chapterNumber,
        pageUrls,
        currentChapter.title
      );
      toast.success("Đã tải xong chương để đọc offline ✅");
    } catch {
      toast.error("Lỗi khi tải chương về máy");
    }
  };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-zinc-700/80 bg-zinc-900/90 px-3 py-2 shadow-2xl backdrop-blur-xl max-w-[95vw]">
        {/* Back to detail */}
        <Link
          href={`/comics/${comicSlug}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
          title="Về trang chi tiết truyện"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        {/* Prev Chapter */}
        {prevChapter ? (
          <Link
            href={`/comics/${comicSlug}/chuong-${prevChapter.chapterNumber}`}
            className="flex h-9 items-center gap-1 rounded-xl bg-zinc-800 px-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
            title={`Chương ${prevChapter.chapterNumber}`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Trước</span>
          </Link>
        ) : (
          <button disabled className="flex h-9 items-center gap-1 rounded-xl bg-zinc-800/40 px-3 text-xs text-zinc-600 cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Trước</span>
          </button>
        )}

        {/* Chapter Selector Dropdown */}
        <div className="relative">
          <select
            value={currentChapter.id}
            onChange={handleChapterSelect}
            className="h-9 appearance-none rounded-xl border border-zinc-700/80 bg-zinc-800 px-3 pr-8 text-xs font-bold text-orange-400 outline-none hover:border-zinc-600 transition"
          >
            {sorted.map((ch) => (
              <option key={ch.id} value={ch.id} className="bg-zinc-900 text-zinc-100 font-medium">
                Chương {ch.chapterNumber} {ch.title ? `— ${ch.title}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Next Chapter */}
        {nextChapter ? (
          <Link
            href={`/comics/${comicSlug}/chuong-${nextChapter.chapterNumber}`}
            className="flex h-9 items-center gap-1 rounded-xl bg-orange-500 px-3 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 transition"
            title={`Chương ${nextChapter.chapterNumber}`}
          >
            <span className="hidden sm:inline">Tiếp</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <button disabled className="flex h-9 items-center gap-1 rounded-xl bg-zinc-800/40 px-3 text-xs text-zinc-600 cursor-not-allowed">
            <span className="hidden sm:inline">Tiếp</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <div className="h-5 w-px bg-zinc-800 mx-1 hidden sm:block" />

        {/* Offline Download Button */}
        <button
          onClick={handleOfflineDownload}
          disabled={isDownloading}
          className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition cursor-pointer ${
            isDownloaded
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : isDownloading
              ? "bg-orange-500/20 text-orange-400"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
          }`}
          title={isDownloaded ? "Đã lưu offline" : "Tải chương này đọc offline"}
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
              <span className="hidden sm:inline">{downloadPercent}%</span>
            </>
          ) : isDownloaded ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="hidden sm:inline">Offline</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Tải offline</span>
            </>
          )}
        </button>

        {/* Reader Settings Modal Trigger */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition cursor-pointer"
          title="Cài đặt giao diện đọc"
        >
          <Sliders className="h-4 w-4" />
        </button>

        {/* Report Chapter Modal Trigger */}
        <button
          onClick={() => setReportOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-amber-400/80 hover:text-amber-300 hover:bg-zinc-700 transition cursor-pointer"
          title="Báo lỗi chương này"
        >
          <Flag className="h-4 w-4" />
        </button>

        {/* Comments Scroll Trigger */}
        <a
          href="#comments-section"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
          title="Xem bình luận"
        >
          <MessageSquare className="h-4 w-4" />
        </a>

        {/* Live Readers Realtime Badge */}
        <div
          className="hidden sm:flex h-9 items-center gap-1.5 rounded-xl bg-zinc-800/80 px-2.5 text-[11px] font-semibold text-zinc-300 border border-zinc-700/50"
          title="Số người đang đọc chương này trực tiếp"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Users className="h-3 w-3 text-zinc-400" />
          <span className="font-bold text-white">{liveCount}</span>
        </div>
      </div>

      <ReaderSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        chapterId={currentChapter.id}
        chapterNumber={currentChapter.chapterNumber}
      />
    </>
  );
}

