"use client";

import React, { useState } from "react";
import { SafeImage } from "@/components/common/SafeImage";
import { Trophy, Eye, Tags, ChevronRight } from "lucide-react";
import { PrefetchLink } from "@/components/common/PrefetchLink";
import type { ComicCardDTO, CategoryDTO, RankingPeriod } from "@/types";

export interface RankingSidebarProps {
  initialRankings?: {
    daily: ComicCardDTO[];
    weekly: ComicCardDTO[];
    monthly: ComicCardDTO[];
  };
  categories?: CategoryDTO[];
}

export function RankingSidebar({ initialRankings, categories = [] }: RankingSidebarProps) {
  const [activeTab, setActiveTab] = useState<RankingPeriod>("daily");

  const currentList = initialRankings ? initialRankings[activeTab] || [] : [];

  return (
    <div className="space-y-6">
      {/* 🏆 Bảng Xếp Hạng Box */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
              <Trophy className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-100">
              BẢNG XẾP HẠNG
            </h2>
          </div>
        </div>

        {/* Tab Buttons (Top Ngày | Top Tuần | Top Tháng) */}
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-800/60 p-1 mb-4">
          <button
            onClick={() => setActiveTab("daily")}
            className={`rounded-lg py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === "daily"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Top Ngày
          </button>
          <button
            onClick={() => setActiveTab("weekly")}
            className={`rounded-lg py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === "weekly"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Top Tuần
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`rounded-lg py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === "monthly"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Top Tháng
          </button>
        </div>

        {/* Ranked Items List */}
        <div className="space-y-2.5">
          {currentList.slice(0, 10).map((comic, index) => {
            const rank = index + 1;
            const rankBadgeColor =
              rank === 1
                ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20"
                : rank === 2
                  ? "bg-zinc-300 text-zinc-950"
                  : rank === 3
                    ? "bg-amber-700 text-white"
                    : "bg-zinc-800 text-zinc-400";

            const latestChap = comic.latestChapterNumber ?? (comic.chapterCount > 0 ? comic.chapterCount : null);

            return (
              <div
                key={comic.id}
                className="group flex items-center gap-3 rounded-xl p-2 hover:bg-zinc-800/50 transition border border-transparent hover:border-zinc-800"
              >
                {/* Rank Number */}
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black ${rankBadgeColor}`}
                >
                  {rank}
                </span>

                {/* Thumbnail */}
                <PrefetchLink
                  href={`/comics/${comic.slug}`}
                  className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-800"
                >
                  <SafeImage
                    src={comic.coverImage || "/icons/icon-192.png"}
                    alt={comic.title}
                    fill
                    sizes="48px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </PrefetchLink>

                {/* Info */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <PrefetchLink
                    href={`/comics/${comic.slug}`}
                    className="block truncate text-xs font-bold text-zinc-200 transition group-hover:text-orange-400"
                    title={comic.title}
                  >
                    {comic.title}
                  </PrefetchLink>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    {latestChap !== null ? (
                      <PrefetchLink
                        href={`/comics/${comic.slug}/chuong-${latestChap}`}
                        className="text-orange-400 hover:text-orange-300 font-medium hover:underline truncate max-w-[90px]"
                      >
                        Chương {latestChap}
                      </PrefetchLink>
                    ) : (
                      <span className="text-zinc-500">Đang cập nhật</span>
                    )}

                    <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <Eye className="h-2.5 w-2.5" />
                      {comic.views > 1000 ? `${(comic.views / 1000).toFixed(1)}k` : comic.views}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View all rankings link */}
        <div className="mt-4 pt-3 border-t border-zinc-800 text-center">
          <PrefetchLink
            href="/comics?sort=views"
            className="inline-flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300 transition"
          >
            <span>Xem đầy đủ bảng xếp hạng</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </PrefetchLink>
        </div>
      </div>

      {/* 🏷️ Thể Loại Nổi Bật Box */}
      {categories.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
              <Tags className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-100">
              THỂ LOẠI NỔI BẬT
            </h2>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 24).map((cat) => (
              <PrefetchLink
                key={cat.id}
                href={`/comics?genres=${cat.slug}`}
                className="rounded-lg border border-zinc-800 bg-zinc-800/60 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400 transition active:scale-95"
              >
                {cat.name}
              </PrefetchLink>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 text-center">
            <PrefetchLink
              href="/categories"
              className="inline-flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300 transition"
            >
              <span>Xem tất cả thể loại</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </PrefetchLink>
          </div>
        </div>
      )}
    </div>
  );
}

export default RankingSidebar;
