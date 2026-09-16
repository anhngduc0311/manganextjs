"use client";

import React from "react";
import Image from "next/image";
import { Eye, Star, Flame } from "lucide-react";
import { PrefetchLink } from "@/components/common/PrefetchLink";
import { formatTimeAgoVi } from "@/lib/format-time";
import type { ComicCardDTO } from "@/types";

export interface ComicCardProps {
  comic: ComicCardDTO;
  priority?: boolean;
  showHotBadge?: boolean;
}

export function ComicCard({ comic, priority = false, showHotBadge }: ComicCardProps) {
  const isHot = showHotBadge !== undefined ? showHotBadge : comic.views > 5000 || comic.status === "ONGOING";
  const latestChap = comic.latestChapterNumber ?? (comic.chapterCount > 0 ? comic.chapterCount : null);
  const timeAgo = formatTimeAgoVi(comic.updatedAt);

  return (
    <div className="group relative flex flex-col rounded-xl bg-zinc-900/40 p-2 border border-zinc-800/60 hover:border-orange-500/40 hover:bg-zinc-900/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/5 active:scale-[0.98]">
      {/* Cover Image Container */}
      <PrefetchLink
        href={`/comics/${comic.slug}`}
        className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-zinc-800 block shadow-inner"
      >
        <Image
          src={comic.coverImage || "/icons/icon-192.png"}
          alt={comic.title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Subtle Dark Gradient at Bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Top Left: Time ago Badge */}
        {timeAgo && (
          <div className="absolute top-2 left-2 z-10">
            <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md">
              {timeAgo}
            </span>
          </div>
        )}

        {/* Top Right: Hot / Status Badge */}
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          {comic.status === "COMPLETED" ? (
            <span className="rounded bg-sky-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white shadow-md">
              Full
            </span>
          ) : isHot ? (
            <span className="flex items-center gap-0.5 rounded bg-gradient-to-r from-red-600 to-orange-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
              <Flame className="h-2.5 w-2.5 fill-white" /> Hot
            </span>
          ) : null}
        </div>

        {/* Bottom stats inside image */}
        <div className="absolute bottom-1.5 left-2 right-2 z-10 flex items-center justify-between text-[10px] text-zinc-300 font-medium pointer-events-none">
          <span className="flex items-center gap-0.5 text-amber-400">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {comic.ratingAvg > 0 ? comic.ratingAvg.toFixed(1) : "5.0"}
          </span>
          <span className="flex items-center gap-1 bg-black/50 px-1 rounded text-zinc-300">
            <Eye className="h-2.5 w-2.5" />
            {comic.views > 1000 ? `${(comic.views / 1000).toFixed(1)}k` : comic.views}
          </span>
        </div>
      </PrefetchLink>

      {/* Book Info Section */}
      <div className="mt-2 flex flex-1 flex-col justify-between px-0.5">
        <div>
          <PrefetchLink
            href={`/comics/${comic.slug}`}
            className="line-clamp-2 text-[13px] font-bold text-zinc-100 transition-colors group-hover:text-orange-400 leading-snug"
            title={comic.title}
          >
            {comic.title}
          </PrefetchLink>
        </div>

        {/* Latest Chapter Link */}
        <div className="mt-1.5 pt-1 border-t border-zinc-800/60 flex items-center justify-between text-xs">
          {latestChap !== null ? (
            <PrefetchLink
              href={`/comics/${comic.slug}/chuong-${latestChap}`}
              className="text-orange-400 hover:text-orange-300 font-semibold text-[11px] hover:underline transition truncate"
              title={`Đọc Chương ${latestChap}`}
            >
              Chương {latestChap}
            </PrefetchLink>
          ) : (
            <span className="text-zinc-500 text-[11px]">Đang cập nhật</span>
          )}

          {comic.categories && comic.categories[0] && (
            <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded truncate max-w-[70px]">
              {comic.categories[0].name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComicCard;
