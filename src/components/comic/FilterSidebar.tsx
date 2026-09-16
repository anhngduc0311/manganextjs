"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, RotateCcw } from "lucide-react";
import type { CategoryDTO } from "@/types";

export interface FilterSidebarProps {
  categories: CategoryDTO[];
}

export function FilterSidebar({ categories }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentGenres = searchParams.get("genres") ? searchParams.get("genres")!.split(",").filter(Boolean) : [];
  const currentStatus = searchParams.get("status") || "";
  const currentSort = searchParams.get("sort") || "updatedAt";

  const updateFilters = (newGenres: string[], newStatus: string, newSort: string) => {
    const params = new URLSearchParams();
    if (newGenres.length > 0) {
      params.set("genres", newGenres.join(","));
    }
    if (newStatus) {
      params.set("status", newStatus);
    }
    if (newSort && newSort !== "updatedAt") {
      params.set("sort", newSort);
    }
    params.set("page", "1");

    router.push(`/comics?${params.toString()}`, { scroll: false });
  };

  const handleGenreToggle = (slug: string) => {
    const next = currentGenres.includes(slug)
      ? currentGenres.filter((s) => s !== slug)
      : [...currentGenres, slug];
    updateFilters(next, currentStatus, currentSort);
  };

  const handleStatusChange = (status: string) => {
    updateFilters(currentGenres, status, currentSort);
  };

  const handleSortChange = (sort: string) => {
    updateFilters(currentGenres, currentStatus, sort);
  };

  const handleReset = () => {
    router.push("/comics");
  };

  const hasActiveFilters = currentGenres.length > 0 || !!currentStatus || currentSort !== "updatedAt";

  return (
    <aside className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-200">
          <Filter className="h-4 w-4 text-orange-500" /> Bộ Lọc Truyện
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 transition cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" /> Đặt lại
          </button>
        )}
      </div>

      {/* Sắp xếp */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Sắp xếp theo</label>
        <select
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-700/80 bg-zinc-800/90 py-2 px-3 text-xs text-zinc-200 outline-none focus:border-orange-500"
        >
          <option value="updatedAt">Mới cập nhật gần đây</option>
          <option value="views">Lượt xem nhiều nhất</option>
          <option value="ratingAvg">Đánh giá cao nhất</option>
          <option value="title">Tên truyện (A-Z)</option>
        </select>
      </div>

      {/* Trạng thái */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Tình trạng ra truyện</label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: "", label: "Tất cả" },
            { value: "ONGOING", label: "Đang tiến hành" },
            { value: "COMPLETED", label: "Đã hoàn thành" },
          ].map((st) => (
            <button
              key={st.value}
              onClick={() => handleStatusChange(st.value)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                currentStatus === st.value
                  ? "bg-orange-500 text-white font-semibold shadow-sm shadow-orange-500/20"
                  : "border border-zinc-800 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Thể loại */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Thể loại</label>
          {currentGenres.length > 0 && (
            <span className="text-[11px] text-orange-400 font-semibold">{currentGenres.length} đã chọn</span>
          )}
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
          {categories.map((cat) => {
            const selected = currentGenres.includes(cat.slug);
            return (
              <button
                key={cat.id}
                onClick={() => handleGenreToggle(cat.slug)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition cursor-pointer ${
                  selected
                    ? "bg-orange-500/15 text-orange-400 font-semibold border border-orange-500/30"
                    : "text-zinc-300 hover:bg-zinc-800/80"
                }`}
              >
                <span>{cat.name}</span>
                {selected && <span className="text-orange-400 font-bold">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
