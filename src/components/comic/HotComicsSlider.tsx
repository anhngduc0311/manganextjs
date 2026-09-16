"use client";

import React, { useRef } from "react";
import { Flame, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { ComicCard } from "@/components/comic/ComicCard";
import { PrefetchLink } from "@/components/common/PrefetchLink";
import type { ComicCardDTO } from "@/types";

export interface HotComicsSliderProps {
  comics: ComicCardDTO[];
}

export function HotComicsSlider({ comics }: HotComicsSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!comics || comics.length === 0) return null;

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 600;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative space-y-3">
      {/* Heading Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500">
            <Flame className="h-4 w-4 fill-orange-500" />
          </div>
          <h2 className="text-base font-black uppercase tracking-wider text-zinc-100 sm:text-lg">
            TRUYỆN HOT ĐỀ CỬ
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Left/Right Buttons */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => handleScroll("left")}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-orange-500/50 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
              aria-label="Cuộn trái"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-orange-500/50 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
              aria-label="Cuộn phải"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <PrefetchLink
            href="/comics?sort=views"
            className="group flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300 transition"
          >
            <span>Xem Tất Cả</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </PrefetchLink>
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {comics.map((comic, index) => (
          <div
            key={comic.id}
            className="w-[160px] sm:w-[185px] md:w-[195px] shrink-0 snap-start"
          >
            <ComicCard comic={comic} priority={index < 4} showHotBadge={true} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default HotComicsSlider;
