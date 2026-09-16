"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ArrowUpDown, Eye, Clock } from "lucide-react";
import type { ChapterDTO } from "@/types";

export interface ChapterListProps {
  comicSlug: string;
  chapters: ChapterDTO[];
  lastReadChapterId?: string | null;
}

export function ChapterList({ comicSlug, chapters, lastReadChapterId }: ChapterListProps) {
  const [search, setSearch] = useState("");
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = chapters
    .filter((ch) => {
      if (!search.trim()) return true;
      const numMatch = ch.chapterNumber.toString().includes(search.trim());
      const titleMatch = ch.title?.toLowerCase().includes(search.trim().toLowerCase());
      return numMatch || titleMatch;
    })
    .sort((a, b) => (sortDesc ? b.chapterNumber - a.chapterNumber : a.chapterNumber - b.chapterNumber));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl">
      {/* Header with Search and Sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-zinc-100">Danh Sách Chương</h3>
          <p className="text-xs text-zinc-400">Tổng cộng {chapters.length} chương</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Chapter Search Input */}
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm số chương..."
              className="w-full rounded-lg border border-zinc-700/80 bg-zinc-800/80 py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-orange-500"
            />
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortDesc(!sortDesc)}
            className="flex items-center gap-1 rounded-lg border border-zinc-700/80 bg-zinc-800/80 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition cursor-pointer shrink-0"
            title="Đổi thứ tự sắp xếp"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-orange-400" />
            <span>{sortDesc ? "Mới nhất" : "Cũ nhất"}</span>
          </button>
        </div>
      </div>

      {/* Chapters Grid / List */}
      <div className="mt-4 max-h-[460px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            Không tìm thấy chương nào phù hợp với từ khóa &quot;{search}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filtered.map((ch) => {
              const isLastRead = ch.id === lastReadChapterId;
              const chapterSlug = `chuong-${ch.chapterNumber}`;

              return (
                <Link
                  key={ch.id}
                  href={`/comics/${comicSlug}/${chapterSlug}`}
                  prefetch={true}
                  className={`group flex items-center justify-between rounded-xl border p-3 text-xs transition duration-150 active:scale-[0.98] ${
                    isLastRead
                      ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
                      : "border-zinc-800/80 bg-zinc-900 hover:border-orange-500/40 hover:bg-zinc-800/60 text-zinc-300"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-zinc-100 group-hover:text-orange-400 transition">
                        Chương {ch.chapterNumber}
                      </span>
                      {ch.title && <span className="truncate text-zinc-400">— {ch.title}</span>}
                    </div>
                    {isLastRead && (
                      <span className="mt-1 inline-block text-[10px] font-semibold text-orange-400">
                        Đang đọc gần đây
                      </span>
                    )}
                  </div>

                  <div className="ml-3 flex items-center gap-3 text-[11px] text-zinc-500 shrink-0">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {ch.views > 1000 ? `${(ch.views / 1000).toFixed(1)}k` : ch.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(ch.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
