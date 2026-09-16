"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // When route changes complete, finish loading
  useEffect(() => {
    setLoading(false);
    setProgress(100);
    const timer = setTimeout(() => setProgress(0), 250);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Intercept all internal link clicks for instant 0ms feedback
  useEffect(() => {
    function handleTrigger(e: Event) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Only handle internal links
      if (
        href.startsWith("/") &&
        !href.startsWith("#") &&
        !target.hasAttribute("download") &&
        target.getAttribute("target") !== "_blank"
      ) {
        try {
          const url = new URL(href, window.location.origin);
          // If clicking the current exact URL, ignore
          if (url.pathname === window.location.pathname && url.search === window.location.search) {
            return;
          }
        } catch {
          return;
        }

        setLoading(true);
        setProgress((prev) => (prev === 0 ? 35 : prev));

        const timer1 = setTimeout(() => setProgress(75), 80);
        const timer2 = setTimeout(() => setProgress(90), 250);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    }

    document.addEventListener("pointerdown", handleTrigger, { capture: true, passive: true });
    document.addEventListener("click", handleTrigger, { capture: true });
    return () => {
      document.removeEventListener("pointerdown", handleTrigger, { capture: true });
      document.removeEventListener("click", handleTrigger, { capture: true });
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div className="pointer-events-none fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 shadow-[0_0_12px_#f97316] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "150ms" : "250ms",
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
