import React from "react";
import Image from "next/image";
import { Eye, Star, BookOpen } from "lucide-react";
import { PrefetchLink } from "@/components/common/PrefetchLink";
import type { ComicCardDTO } from "@/types";

export interface ComicCardProps {
  comic: ComicCardDTO;
  priority?: boolean;
}

export function ComicCard({ comic, priority = false }: ComicCardProps) {
  const statusColors = {
    ONGOING: "bg-emerald-500/80 text-white",
    COMPLETED: "bg-sky-500/80 text-white",
    DROPPED: "bg-zinc-600/80 text-white",
  };

  const statusLabels = {
    ONGOING: "Đang ra",
    COMPLETED: "Hoàn thành",
    DROPPED: "Tạm dừng",
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-2 transition-all duration-200 hover:-translate-y-1.5 hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5 active:scale-[0.98]">
      {/* Cover Image */}
      <PrefetchLink href={`/comics/${comic.slug}`} className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-zinc-800">
        <Image
          src={comic.coverImage || "/icons/icon-192.png"}
          alt={comic.title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
              statusColors[comic.status] || "bg-zinc-700 text-white"
            }`}
          >
            {statusLabels[comic.status] || "Truyện"}
          </span>
        </div>

        {/* Bottom Metadata in Image */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px] font-semibold">
          <span className="flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 backdrop-blur-xs">
            <BookOpen className="h-3 w-3 text-orange-400" />
            {comic.chapterCount} chương
          </span>
          <span className="flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 backdrop-blur-xs">
            <Eye className="h-3 w-3 text-zinc-300" />
            {comic.views > 1000 ? `${(comic.views / 1000).toFixed(1)}k` : comic.views}
          </span>
        </div>
      </PrefetchLink>

      {/* Info Section */}
      <div className="mt-2.5 flex flex-1 flex-col justify-between px-1">
        <div>
          <PrefetchLink
            href={`/comics/${comic.slug}`}
            className="line-clamp-2 text-sm font-bold text-zinc-100 transition-colors group-hover:text-orange-400 leading-snug"
            title={comic.title}
          >
            {comic.title}
          </PrefetchLink>

          {comic.categories && comic.categories.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {comic.categories.slice(0, 2).map((cat) => (
                <span key={cat.slug} className="text-[10px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                  {cat.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Rating Footer */}
        <div className="mt-2 flex items-center justify-between pt-1 text-xs text-zinc-400">
          <span className="flex items-center gap-1 font-semibold text-amber-400">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {comic.ratingAvg > 0 ? comic.ratingAvg.toFixed(1) : "5.0"}
          </span>
          <span className="text-[10px] text-zinc-400">
            {new Date(comic.updatedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
          </span>
        </div>
      </div>
    </div>
  );
}
