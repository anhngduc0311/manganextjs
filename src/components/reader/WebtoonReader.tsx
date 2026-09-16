"use client";

import React from "react";
import Image from "next/image";
import { useReaderStore } from "@/stores/reader-store";
import type { ChapterPageDTO } from "@/types";

export interface WebtoonReaderProps {
  pages: ChapterPageDTO[];
  offlineBlobUrls?: Record<number, string>;
}

export function WebtoonReader({ pages, offlineBlobUrls }: WebtoonReaderProps) {
  const { brightness, fitWidth } = useReaderStore();

  if (pages.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-zinc-400">
        Chương này hiện chưa có trang ảnh nào.
      </div>
    );
  }

  return (
    <div
      className={`mx-auto flex flex-col items-center transition-all duration-200 ${
        fitWidth ? "w-full max-w-3xl" : "w-full max-w-5xl"
      }`}
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {pages.map((page, index) => {
        const imageSrc = offlineBlobUrls?.[page.pageIndex] || page.imageUrl;

        return (
          <div key={`page-${page.pageIndex}-${index}`} className="relative w-full overflow-hidden bg-zinc-950">
            <Image
              src={imageSrc}
              alt={`Trang ${page.pageIndex}`}
              width={1000}
              height={1400}
              priority={index < 3}
              sizes="(max-width: 768px) 100vw, 768px"
              className="h-auto w-full object-contain select-none pointer-events-none"
              loading={index < 3 ? undefined : "lazy"}
            />
          </div>
        );
      })}
    </div>
  );
}
