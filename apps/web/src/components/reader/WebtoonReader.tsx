"use client";

import React, { useState, useEffect, useRef } from "react";
import { useReaderStore } from "@/stores/reader-store";
import { ReaderPageImage } from "./ReaderPageImage";
import { useImagePreloader } from "@/hooks/use-image-preloader";
import type { ChapterPageDTO } from "@/types";

export interface WebtoonReaderProps {
  pages: ChapterPageDTO[];
  nextChapterFirstUrls?: string[];
}

export function WebtoonReader({ pages, nextChapterFirstUrls = [] }: WebtoonReaderProps) {
  const { brightness, fitWidth, zoom, preloadAheadCount, setCurrentPage } = useReaderStore();
  const [visibleIndex, setVisibleIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const imageUrls = pages.map((p) => p.imageUrl);

  // Hook to buffer sliding window of images in memory
  useImagePreloader({
    urls: imageUrls,
    currentIndex: visibleIndex,
    bufferAhead: preloadAheadCount || 4,
    bufferBehind: 1,
    nextChapterFirstUrls,
    shouldPrefetchNextChapter: visibleIndex >= Math.max(0, pages.length - 3),
  });

  // Intersection Observer to track currently viewed page during scroll
  useEffect(() => {
    if (pages.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const indexStr = entry.target.getAttribute("data-page-index");
            if (indexStr !== null) {
              const idx = parseInt(indexStr, 10);
              if (!isNaN(idx)) {
                setVisibleIndex(idx);
                setCurrentPage(idx + 1);
              }
            }
          }
        }
      },
      {
        rootMargin: "200px 0px 400px 0px", // Trigger slightly ahead of viewport
        threshold: 0.1,
      }
    );

    const pageElements = document.querySelectorAll("[data-page-index]");
    pageElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [pages, setCurrentPage]);

  if (pages.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-zinc-400">
        Chương này hiện chưa có trang ảnh nào.
      </div>
    );
  }

  const baseMaxWidth = fitWidth ? 768 : 1100;
  const targetMaxWidth = Math.round((baseMaxWidth * zoom) / 100);

  return (
    <div
      ref={containerRef}
      className="mx-auto flex flex-col items-center transition-all duration-200"
      style={{
        filter: `brightness(${brightness}%)`,
        maxWidth: `${targetMaxWidth}px`,
        width: "100%",
      }}
    >
      {pages.map((page, index) => (
        <div
          key={`page-${page.pageIndex}-${index}`}
          id={`page-${page.pageIndex + 1}`}
          data-page-index={index}
          className="relative w-full overflow-hidden bg-zinc-950"
        >
          <ReaderPageImage
            src={page.imageUrl}
            alt={`Trang ${page.pageIndex + 1}`}
            pageIndex={page.pageIndex}
            width={1000}
            height={1400}
            priority={index < 2}
            sizes="(max-width: 768px) 100vw, 1100px"
            className="h-auto w-full object-contain select-none"
          />
        </div>
      ))}
    </div>
  );
}
