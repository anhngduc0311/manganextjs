"use client";

import { useEffect, useRef } from "react";
import { useReaderStore } from "@/stores/reader-store";

export function useAutoScroll() {
  const { isAutoScroll, autoScrollSpeed, setIsAutoScroll } = useReaderStore();
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAutoScroll) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    let lastTime = performance.now();

    const scrollLoop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Base speed: 60px per second multiplied by autoScrollSpeed
      const pixelsToScroll = 60 * autoScrollSpeed * delta;
      window.scrollBy(0, pixelsToScroll);

      // Check if reached near bottom of the page
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 30) {
        setIsAutoScroll(false);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(scrollLoop);
    };

    animationFrameRef.current = requestAnimationFrame(scrollLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAutoScroll, autoScrollSpeed, setIsAutoScroll]);
}
