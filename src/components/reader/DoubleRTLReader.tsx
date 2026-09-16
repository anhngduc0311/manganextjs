"use client";

import React from "react";
import Image from "next/image";
import { useReaderStore } from "@/stores/reader-store";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ChapterPageDTO } from "@/types";

export interface DoubleRTLReaderProps {
  pages: ChapterPageDTO[];
  offlineBlobUrls?: Record<number, string>;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
}

export function DoubleRTLReader({ pages, offlineBlobUrls, onNextChapter, onPrevChapter }: DoubleRTLReaderProps) {
  const { currentPage, setCurrentPage, brightness } = useReaderStore();
  const total = pages.length;

  if (total === 0) {
    return <div className="py-20 text-center text-sm text-zinc-400">Chương này chưa có trang ảnh nào.</div>;
  }

  // Ensure starting at an odd or even page step (e.g. 1-2, 3-4, 5-6)
  const leftPageIndex = currentPage % 2 === 0 ? currentPage : currentPage + 1; // Left page (in RTL is page 2, 4, 6...)
  const rightPageIndex = leftPageIndex - 1; // Right page (in RTL is page 1, 3, 5...)

  const rightPageData = pages[rightPageIndex - 1];
  const leftPageData = pages[leftPageIndex - 1];

  const rightSrc = rightPageData ? (offlineBlobUrls?.[rightPageData.pageIndex] || rightPageData.imageUrl) : "";
  const leftSrc = leftPageData ? (offlineBlobUrls?.[leftPageData.pageIndex] || leftPageData.imageUrl) : "";

  const handleNext = () => {
    if (leftPageIndex < total) {
      setCurrentPage(leftPageIndex + 1);
    } else if (onNextChapter) {
      onNextChapter();
    }
  };

  const handlePrev = () => {
    if (rightPageIndex > 1) {
      setCurrentPage(rightPageIndex - 2);
    } else if (onPrevChapter) {
      onPrevChapter();
    }
  };

  return (
    <div
      className="relative mx-auto flex min-h-[75vh] w-full max-w-6xl flex-col items-center justify-center p-2"
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {/* Two Pages Side by Side Container */}
      <div className="relative flex w-full items-center justify-center gap-1 rounded-2xl bg-zinc-950 p-2 shadow-2xl border border-zinc-800">
        {/* Left Page (Page n+1 in Manga RTL) */}
        <div className="relative aspect-[3/4] w-1/2 max-w-xl overflow-hidden rounded-l-xl bg-zinc-900">
          {leftSrc && (
            <Image
              src={leftSrc}
              alt={`Trang ${leftPageIndex}`}
              fill
              priority
              sizes="(max-width: 1024px) 50vw, 600px"
              className="object-contain select-none"
            />
          )}
        </div>

        {/* Right Page (Page n in Manga RTL) */}
        <div className="relative aspect-[3/4] w-1/2 max-w-xl overflow-hidden rounded-r-xl bg-zinc-900">
          {rightSrc && (
            <Image
              src={rightSrc}
              alt={`Trang ${rightPageIndex}`}
              fill
              priority
              sizes="(max-width: 1024px) 50vw, 600px"
              className="object-contain select-none"
            />
          )}
        </div>

        {/* Click Zones */}
        <div
          onClick={handleNext}
          className="absolute inset-y-0 left-0 w-1/2 cursor-w-resize hover:bg-white/5 transition-colors"
          title="Trang tiếp (RTL - Click bên trái)"
        />
        <div
          onClick={handlePrev}
          className="absolute inset-y-0 right-0 w-1/2 cursor-e-resize hover:bg-white/5 transition-colors"
          title="Trang trước (RTL - Click bên phải)"
        />
      </div>

      {/* Navigation Controls */}
      <div className="mt-4 flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 px-4 py-2 rounded-full shadow-lg">
        <button
          onClick={handleNext}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 hover:bg-orange-500 hover:text-white transition cursor-pointer text-zinc-300"
          aria-label="Trang tiếp theo (RTL)"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-xs font-bold text-zinc-200">
          Trang <span className="text-orange-400">{rightPageIndex}</span>
          {leftPageData ? `-${leftPageIndex}` : ""} / {total} (Manga RTL)
        </span>

        <button
          onClick={handlePrev}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 hover:bg-orange-500 hover:text-white transition cursor-pointer text-zinc-300"
          aria-label="Trang trước (RTL)"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
