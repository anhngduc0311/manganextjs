"use client";

import { useEffect, useCallback } from "react";
import { useReaderStore, type ReaderMode } from "@/stores/reader-store";

interface UseReaderSettingsProps {
  totalPages: number;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
}

export function useReaderSettings({
  totalPages,
  onNextPage,
  onPrevPage,
  onNextChapter,
  onPrevChapter,
}: UseReaderSettingsProps) {
  const { mode, theme, brightness, fitWidth, currentPage, setMode, setTheme, setBrightness, setFitWidth, setCurrentPage } =
    useReaderStore();

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  const cycleMode = useCallback(() => {
    const modes: ReaderMode[] = ["webtoon", "single", "double"];
    const nextIndex = (modes.indexOf(mode) + 1) % modes.length;
    setMode(modes[nextIndex] ?? "webtoon");
  }, [mode, setMode]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        if (mode === "webtoon") {
          window.scrollBy({ top: window.innerHeight * 0.75, behavior: "smooth" });
        } else if (onNextPage && currentPage < totalPages) {
          onNextPage();
        } else if (onNextChapter) {
          onNextChapter();
        }
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        if (mode === "webtoon") {
          window.scrollBy({ top: -window.innerHeight * 0.75, behavior: "smooth" });
        } else if (onPrevPage && currentPage > 1) {
          onPrevPage();
        } else if (onPrevChapter) {
          onPrevChapter();
        }
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        cycleMode();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, currentPage, totalPages, onNextPage, onPrevPage, onNextChapter, onPrevChapter, toggleFullscreen, cycleMode]);

  return {
    mode,
    theme,
    brightness,
    fitWidth,
    currentPage,
    setMode,
    setTheme,
    setBrightness,
    setFitWidth,
    setCurrentPage,
    toggleFullscreen,
    cycleMode,
  };
}
