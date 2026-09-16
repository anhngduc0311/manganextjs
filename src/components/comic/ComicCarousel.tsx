"use client";

import React, { useState, useEffect } from "react";
import { SafeImage } from "@/components/common/SafeImage";
import { ChevronLeft, ChevronRight, BookOpen, Star, Eye } from "lucide-react";
import { PrefetchLink } from "@/components/common/PrefetchLink";
import type { ComicCardDTO } from "@/types";

export interface ComicCarouselProps {
  comics: ComicCardDTO[];
}

export function ComicCarousel({ comics }: ComicCarouselProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (comics.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % comics.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [comics.length]);

  if (comics.length === 0) return null;

  const featured = comics[current];
  if (!featured) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900 shadow-2xl">
      {/* Background Banner with Glass Gradient */}
      <div className="relative h-[320px] sm:h-[380px] md:h-[440px] w-full overflow-hidden">
        <SafeImage
          src={featured.coverImage || "/icons/icon-192.png"}
          alt={featured.title}
          fill
          priority
          sizes="100vw"
          className="object-cover blur-2xl opacity-30 scale-110"
        />

        {/* Ambient Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

        {/* Content Box */}
        <div className="absolute inset-0 flex items-center p-6 sm:p-10 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 w-full max-w-5xl">
            {/* Left Poster */}
            <div className="relative hidden md:block h-64 w-48 shrink-0 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
              <SafeImage
                src={featured.coverImage || "/icons/icon-192.png"}
                alt={featured.title}
                fill
                priority
                sizes="192px"
                className="object-cover"
              />
            </div>

            {/* Right Meta & Call to action */}
            <div className="flex flex-1 flex-col items-start space-y-3 sm:space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-400 border border-orange-500/30">
                  🔥 Nổi Bật Tuần Này
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  {featured.ratingAvg > 0 ? featured.ratingAvg.toFixed(1) : "5.0"}
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-400">
                  <Eye className="h-3.5 w-3.5" />
                  {featured.views.toLocaleString()} lượt xem
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight line-clamp-2">
                {featured.title}
              </h2>

              {featured.categories && featured.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {featured.categories.map((c) => (
                    <span key={c.slug} className="rounded-md bg-zinc-800/90 px-2.5 py-1 text-xs text-zinc-300">
                      {c.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <PrefetchLink
                  href={`/comics/${featured.slug}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 hover:scale-105 transition active:scale-95"
                >
                  <BookOpen className="h-4 w-4" /> Đọc Ngay
                </PrefetchLink>
                <PrefetchLink
                  href={`/comics/${featured.slug}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-5 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition active:scale-95"
                >
                  Xem Chi Tiết
                </PrefetchLink>
              </div>
            </div>
          </div>
        </div>

        {/* Prev / Next controls */}
        {comics.length > 1 && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={() => setCurrent((prev) => (prev - 1 + comics.length) % comics.length)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-orange-500 transition cursor-pointer"
              aria-label="Banner trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrent((prev) => (prev + 1) % comics.length)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-orange-500 transition cursor-pointer"
              aria-label="Banner sau"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
