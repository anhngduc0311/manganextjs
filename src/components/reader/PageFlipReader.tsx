"use client";

import React from "react";
import Image from "next/image";
import { useReaderStore } from "@/stores/reader-store";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ChapterPageDTO } from "@/types";

export interface PageFlipReaderProps {
  pages: ChapterPageDTO[];
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
}

export function PageFlipReader({ pages, onNextChapter, onPrevChapter }: PageFlipReaderProps) {
  const { currentPage, setCurrentPage, brightness, zoom } = useReaderStore();
  const total = pages.length;

  if (total === 0) {
    return <div className="py-20 text-center text-sm text-zinc-400">Chương này chưa có trang ảnh nào.</div>;
  }

  const safePage = Math.max(1, Math.min(currentPage, total));
  const currentPageData = pages[safePage - 1];
  const imageSrc = currentPageData ? currentPageData.imageUrl : "";

  const handlePrev = () => {
    if (safePage > 1) {
      setCurrentPage(safePage - 1);
    } else if (onPrevChapter) {
      onPrevChapter();
    }
  };

  const handleNext = () => {
    if (safePage < total) {
      setCurrentPage(safePage + 1);
    } else if (onNextChapter) {
      onNextChapter();
    }
  };

  const targetMaxWidth = Math.round((672 * zoom) / 100);

  return (
    <div
      className="relative mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col items-center justify-center p-2 transition-all duration-200"
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {/* Current Page Display */}
      <div
        className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-zinc-950 shadow-2xl border border-zinc-800 transition-all duration-200"
        style={{ maxWidth: `${targetMaxWidth}px` }}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={`Trang ${safePage}`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-contain select-none"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">Trang {safePage}</div>
        )}

        {/* Click Zones (Left / Right) */}
        <div
          onClick={handlePrev}
          className="absolute inset-y-0 left-0 w-1/2 cursor-w-resize hover:bg-white/5 transition-colors"
          title="Trang trước (Phím A / ←)"
        />
        <div
          onClick={handleNext}
          className="absolute inset-y-0 right-0 w-1/2 cursor-e-resize hover:bg-white/5 transition-colors"
          title="Trang sau (Phím D / →)"
        />
      </div>

      {/* Navigation Controls */}
      <div className="mt-4 flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 px-4 py-2 rounded-full shadow-lg">
        <button
          onClick={handlePrev}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 hover:bg-orange-500 hover:text-white transition cursor-pointer text-zinc-300"
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-xs font-bold text-zinc-200">
          Trang <span className="text-orange-400">{safePage}</span> / {total}
        </span>

        <button
          onClick={handleNext}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 hover:bg-orange-500 hover:text-white transition cursor-pointer text-zinc-300"
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
