"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useReaderStore } from "@/stores/reader-store";
import { useReaderSettings } from "@/hooks/use-reader-settings";
import { useOfflineStorage } from "@/hooks/use-offline-storage";
import { WebtoonReader } from "./WebtoonReader";
import { PageFlipReader } from "./PageFlipReader";
import { DoubleRTLReader } from "./DoubleRTLReader";
import type { ChapterPageDTO } from "@/types";

export interface ReaderViewProps {
  comicSlug: string;
  pages: ChapterPageDTO[];
  prevChapterNumber?: number | null;
  nextChapterNumber?: number | null;
  chapterId?: string;
}

export function ReaderView({
  comicSlug,
  pages,
  prevChapterNumber,
  nextChapterNumber,
  chapterId,
}: ReaderViewProps) {
  const router = useRouter();
  const { mode, currentPage, setCurrentPage } = useReaderStore();
  const { getOfflineChapter } = useOfflineStorage();
  const [offlineBlobUrls, setOfflineBlobUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    let active = true;
    if (chapterId) {
      getOfflineChapter(chapterId).then((data) => {
        if (active && data && data.pages && data.pages.length > 0) {
          const map: Record<number, string> = {};
          data.pages.forEach((blob, idx) => {
            map[idx] = URL.createObjectURL(blob);
          });
          setOfflineBlobUrls(map);
        }
      });
    }

    return () => {
      active = false;
      Object.values(offlineBlobUrls).forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [chapterId, getOfflineChapter]);

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

  return (
    <div className="w-full">
      {mode === "webtoon" && <WebtoonReader pages={pages} offlineBlobUrls={offlineBlobUrls} />}
      {mode === "single" && (
        <PageFlipReader
          pages={pages}
          offlineBlobUrls={offlineBlobUrls}
          onNextChapter={handleNextChapter}
          onPrevChapter={handlePrevChapter}
        />
      )}
      {mode === "double" && (
        <DoubleRTLReader
          pages={pages}
          offlineBlobUrls={offlineBlobUrls}
          onNextChapter={handleNextChapter}
          onPrevChapter={handlePrevChapter}
        />
      )}
    </div>
  );
}

