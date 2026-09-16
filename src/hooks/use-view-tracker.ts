"use client";

import { useEffect, useRef } from "react";

/**
 * Hook to track chapter views after user actively spends time reading (>5s)
 * Prevents counting accidental bounces or bot crawlers.
 */
export function useViewTracker(comicId?: string, chapterId?: string, delayMs = 5000) {
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!comicId || !chapterId) return;

    const currentKey = `${comicId}:${chapterId}`;
    if (trackedRef.current === currentKey) return;

    const timer = setTimeout(() => {
      trackedRef.current = currentKey;

      try {
        fetch("/api/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comicId, chapterId }),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [comicId, chapterId, delayMs]);
}
