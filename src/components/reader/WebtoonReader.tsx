"use client";

import React from "react";
import Image from "next/image";
import { useReaderStore } from "@/stores/reader-store";
import type { ChapterPageDTO } from "@/types";

export interface WebtoonReaderProps {
  pages: ChapterPageDTO[];
}

export function WebtoonReader({ pages }: WebtoonReaderProps) {
  const { brightness, fitWidth, zoom } = useReaderStore();

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
      className="mx-auto flex flex-col items-center transition-all duration-200"
      style={{
        filter: `brightness(${brightness}%)`,
        maxWidth: `${targetMaxWidth}px`,
        width: "100%",
      }}
    >
      {pages.map((page, index) => (
        <div key={`page-${page.pageIndex}-${index}`} className="relative w-full overflow-hidden bg-zinc-950">
          <Image
            src={page.imageUrl}
            alt={`Trang ${page.pageIndex}`}
            width={1000}
            height={1400}
            priority={index < 3}
            sizes="(max-width: 768px) 100vw, 1100px"
            className="h-auto w-full object-contain select-none pointer-events-none"
            loading={index < 3 ? undefined : "lazy"}
          />
        </div>
      ))}
    </div>
  );
}
