"use client";

import { useEffect, useRef } from "react";
import { preloadImage } from "@/lib/reader-cache";

export interface UseImagePreloaderOptions {
  urls: string[];
  currentIndex?: number;
  bufferAhead?: number;
  bufferBehind?: number;
  nextChapterFirstUrls?: string[];
  shouldPrefetchNextChapter?: boolean;
}

/**
 * Intelligent Sliding Window Image Preloader Hook
 * Automatically pre-downloads & decodes upcoming chapter images in browser background RAM.
 */
export function useImagePreloader({
  urls,
  currentIndex = 0,
  bufferAhead = 4,
  bufferBehind = 1,
  nextChapterFirstUrls = [],
  shouldPrefetchNextChapter = false,
}: UseImagePreloaderOptions) {
  const preloadedSet = useRef<Set<string>>(new Set());

  // 1. Sliding Window Preload for current chapter
  useEffect(() => {
    if (!urls || urls.length === 0) return;

    const total = urls.length;
    const startIndex = Math.max(0, currentIndex - bufferBehind);
    const endIndex = Math.min(total - 1, currentIndex + bufferAhead);

    for (let i = startIndex; i <= endIndex; i++) {
      const url = urls[i];
      if (url && !preloadedSet.current.has(url)) {
        preloadedSet.current.add(url);
        preloadImage(url);
      }
    }
  }, [urls, currentIndex, bufferAhead, bufferBehind]);

  // 2. Initial Burst Preload (first 3 pages immediately upon opening chapter)
  useEffect(() => {
    if (!urls || urls.length === 0) return;
    const initialPages = urls.slice(0, 3);
    for (const url of initialPages) {
      if (url && !preloadedSet.current.has(url)) {
        preloadedSet.current.add(url);
        preloadImage(url);
      }
    }
  }, [urls]);

  // 3. Next Chapter Preload (when user approaches end of current chapter)
  useEffect(() => {
    if (!shouldPrefetchNextChapter || !nextChapterFirstUrls || nextChapterFirstUrls.length === 0) return;

    for (const url of nextChapterFirstUrls) {
      if (url && !preloadedSet.current.has(url)) {
        preloadedSet.current.add(url);
        preloadImage(url);
      }
    }
  }, [shouldPrefetchNextChapter, nextChapterFirstUrls]);
}
