"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Sliders,
  MessageSquare,
  ArrowLeft,
  Flag,
  Users,
  Home,
  Maximize,
  Minimize,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
} from "lucide-react";
import { ReaderSettingsModal } from "./ReaderSettingsModal";
import { ReportModal } from "./ReportModal";
import { useLiveReaders } from "@/hooks/use-live-readers";
import { useReaderStore } from "@/stores/reader-store";
import type { ChapterDTO } from "@/types";

export interface ReaderToolbarProps {
  comicSlug: string;
  comicTitle?: string;
  currentChapter: ChapterDTO;
  allChapters: ChapterDTO[];
  pageUrls?: string[];
}

export function ReaderToolbar({
  comicSlug,
  comicTitle = "Truyện Tranh",
  currentChapter,
  allChapters,
}: ReaderToolbarProps) {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const { liveCount } = useLiveReaders(currentChapter.id);

  const {
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    isAutoScroll,
    toggleAutoScroll,
    autoScrollSpeed,
    setAutoScrollSpeed,
  } = useReaderStore();

  // Auto-hide toolbar on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 60) {
        // Always show near the very top of the page
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current + 8) {
        // Scrolling down -> hide
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 8) {
        // Scrolling up -> show
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

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

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full border-b border-zinc-800/90 bg-[#121217]/95 shadow-xl backdrop-blur-md transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-2 sm:px-4 md:px-6">
          {/* Left: Back / Home & Comic Title */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
              title="Về Trang Chủ"
            >
              <Home className="h-4 w-4" />
            </Link>

            <Link
              href={`/comics/${comicSlug}`}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-zinc-800/80 px-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
              title="Về trang chi tiết truyện"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden md:inline truncate max-w-[140px] lg:max-w-[200px] font-bold text-zinc-100">
                {comicTitle}
              </span>
            </Link>

            <div className="hidden sm:flex items-center">
              <span className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-400 truncate max-w-[120px]">
                Chương {currentChapter.chapterNumber}
              </span>
            </div>
          </div>

          {/* Center: Chapter Controls (Prev, Select, Next) */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Prev Chapter */}
            {prevChapter ? (
              <Link
                href={`/comics/${comicSlug}/chuong-${prevChapter.chapterNumber}`}
                className="flex h-9 items-center gap-1 rounded-xl bg-zinc-800 px-2 sm:px-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
                title={`Chương ${prevChapter.chapterNumber}`}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Trước</span>
              </Link>
            ) : (
              <button
                disabled
                className="flex h-9 items-center gap-1 rounded-xl bg-zinc-800/40 px-2 sm:px-3 text-xs text-zinc-600 cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Trước</span>
              </button>
            )}

            {/* Chapter Selector Dropdown */}
            <div className="relative">
              <select
                value={currentChapter.id}
                onChange={handleChapterSelect}
                className="h-9 appearance-none rounded-xl border border-zinc-700/80 bg-zinc-800/90 pl-2.5 pr-7 text-xs font-bold text-orange-400 outline-none hover:border-zinc-500 transition cursor-pointer max-w-[130px] sm:max-w-[180px]"
              >
                {sorted.map((ch) => (
                  <option key={ch.id} value={ch.id} className="bg-zinc-900 text-zinc-100 font-medium">
                    Chương {ch.chapterNumber} {ch.title ? `— ${ch.title}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            </div>

            {/* Next Chapter */}
            {nextChapter ? (
              <Link
                href={`/comics/${comicSlug}/chuong-${nextChapter.chapterNumber}`}
                className="flex h-9 items-center gap-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-2.5 sm:px-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:brightness-110 transition"
                title={`Chương ${nextChapter.chapterNumber}`}
              >
                <span className="hidden sm:inline">Tiếp</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                disabled
                className="flex h-9 items-center gap-1 rounded-xl bg-zinc-800/40 px-2.5 sm:px-3 text-xs text-zinc-600 cursor-not-allowed"
              >
                <span className="hidden sm:inline">Tiếp</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Right: Zoom Pill + Auto-Scroll Pill + Quick Tools */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Zoom In/Out Widget */}
            <div className="hidden md:flex items-center rounded-xl border border-zinc-700/80 bg-zinc-800/90 px-1 py-0.5 text-xs text-zinc-300">
              <button
                onClick={zoomOut}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-zinc-700 hover:text-white transition cursor-pointer text-zinc-400 hover:text-zinc-100"
                title="Thu nhỏ (-25%)"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <div className="relative">
                <select
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="h-7 appearance-none bg-transparent pl-1.5 pr-4 text-xs font-bold text-zinc-100 hover:text-orange-400 outline-none cursor-pointer"
                >
                  <option value={50} className="bg-zinc-900 text-zinc-100">50%</option>
                  <option value={75} className="bg-zinc-900 text-zinc-100">75%</option>
                  <option value={100} className="bg-zinc-900 text-zinc-100">100%</option>
                  <option value={125} className="bg-zinc-900 text-zinc-100">125%</option>
                  <option value={150} className="bg-zinc-900 text-zinc-100">150%</option>
                  <option value={200} className="bg-zinc-900 text-zinc-100">200%</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-0.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400" />
              </div>
              <button
                onClick={zoomIn}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-zinc-700 hover:text-white transition cursor-pointer text-zinc-400 hover:text-zinc-100"
                title="Phóng to (+25%)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Auto-Scroll / Auto-Read Widget */}
            <div className="flex items-center rounded-xl border border-zinc-700/80 bg-zinc-800/90 px-1 py-0.5 text-xs text-zinc-300">
              <button
                onClick={toggleAutoScroll}
                className={`flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold transition cursor-pointer ${
                  isAutoScroll
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30 animate-pulse"
                    : "hover:bg-zinc-700 hover:text-white text-zinc-200"
                }`}
                title={isAutoScroll ? "Dừng tự động đọc" : "Bắt đầu tự động đọc"}
              >
                {isAutoScroll ? (
                  <Pause className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current" />
                )}
              </button>
              <div className="relative">
                <select
                  value={autoScrollSpeed}
                  onChange={(e) => setAutoScrollSpeed(Number(e.target.value))}
                  className="h-7 appearance-none bg-transparent pl-1 pr-4 text-xs font-bold text-zinc-100 hover:text-orange-400 outline-none cursor-pointer"
                >
                  <option value={0.5} className="bg-zinc-900 text-zinc-100">0.5x</option>
                  <option value={1} className="bg-zinc-900 text-zinc-100">1x</option>
                  <option value={1.5} className="bg-zinc-900 text-zinc-100">1.5x</option>
                  <option value={2} className="bg-zinc-900 text-zinc-100">2x</option>
                  <option value={3} className="bg-zinc-900 text-zinc-100">3x</option>
                  <option value={5} className="bg-zinc-900 text-zinc-100">5x</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-0.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400" />
              </div>
            </div>

            {/* Reader Settings Modal Trigger */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition cursor-pointer"
              title="Cài đặt chế độ đọc"
            >
              <Sliders className="h-4 w-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition cursor-pointer"
              title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>

            {/* Report Chapter Modal Trigger */}
            <button
              onClick={() => setReportOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800/80 text-amber-400/80 hover:text-amber-300 hover:bg-zinc-700 transition cursor-pointer"
              title="Báo lỗi chương này"
            >
              <Flag className="h-4 w-4" />
            </button>

            {/* Comments Scroll Trigger */}
            <a
              href="#comments-section"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
              title="Xem bình luận"
            >
              <MessageSquare className="h-4 w-4" />
            </a>

            {/* Live Readers Realtime Badge */}
            <div
              className="hidden xl:flex h-9 items-center gap-1.5 rounded-xl bg-zinc-800/60 px-2.5 text-[11px] font-semibold text-zinc-300 border border-zinc-700/40"
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
        </div>
      </header>

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
