"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useReaderStore } from "@/stores/reader-store";
import { useReaderSettings } from "@/hooks/use-reader-settings";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { useViewTracker } from "@/hooks/use-view-tracker";
import { WebtoonReader } from "./WebtoonReader";
import { PageFlipReader } from "./PageFlipReader";
import type { ChapterPageDTO } from "@/types";

export interface ReaderViewProps {
  comicId?: string;
  comicSlug: string;
  pages: ChapterPageDTO[];
  prevChapterNumber?: number | null;
  nextChapterNumber?: number | null;
  chapterId?: string;
}

export function ReaderView({
  comicId,
  comicSlug,
  pages,
  prevChapterNumber,
  nextChapterNumber,
  chapterId,
}: ReaderViewProps) {
  const router = useRouter();
  const { mode, currentPage, setCurrentPage } = useReaderStore();

  // Track view after user has spent >= 5 seconds on the chapter
  useViewTracker(comicId, chapterId);

  const handleNextChapter = () => {
    if (nextChapterNumber !== null && nextChapterNumber !== undefined) {
      router.push(`/comics/${comicSlug}/chuong-${nextChapterNumber}`);
    }
  };

  const handlePrevChapter = () => {
    if (prevChapterNumber !== null && prevChapterNumber !== undefined) {
      router.push(`/comics/${comicSlug}/chuong-${prevChapterNumber}`);
    }
  };

  // Bind Keyboard shortcuts & settings hook
  useReaderSettings({
    totalPages: pages.length,
    onNextPage: () => setCurrentPage(Math.min(pages.length, currentPage + 1)),
    onPrevPage: () => setCurrentPage(Math.max(1, currentPage - 1)),
    onNextChapter: handleNextChapter,
    onPrevChapter: handlePrevChapter,
  });

  // Bind Auto Scroll Loop
  useAutoScroll();

  return (
    <div className="w-full">
      {mode === "webtoon" && <WebtoonReader pages={pages} />}
      {mode === "single" && (
        <PageFlipReader
          pages={pages}
          onNextChapter={handleNextChapter}
          onPrevChapter={handlePrevChapter}
        />
      )}
    </div>
  );
}
