"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, RotateCcw, ChevronDown, Sparkles } from "lucide-react";
import type { CategoryDTO } from "@/types";

export interface ComicFilterBarProps {
  categories: CategoryDTO[];
  totalCount: number;
}

export function ComicFilterBar({ categories, totalCount }: ComicFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAllGenres, setShowAllGenres] = useState(false);

  const currentGenres = searchParams.get("genres")
    ? searchParams.get("genres")!.split(",").filter(Boolean)
    : [];
  const currentStatus = searchParams.get("status") || "";
  const currentSort = searchParams.get("sort") || "updated";

  const countries = [
    { label: "Trung Quốc", slug: "manhua" },
    { label: "Việt Nam", slug: "viet-nam" },
    { label: "Hàn Quốc", slug: "manhwa" },
    { label: "Nhật Bản", slug: "manga" },
    { label: "Mỹ", slug: "comic" },
  ];

  const countrySlugs = countries.map((c) => c.slug);
  const selectedCountry = countries.find((c) => currentGenres.includes(c.slug));

  const updateFilters = (newGenres: string[], newStatus: string, newSort: string) => {
    const params = new URLSearchParams();
    if (newGenres.length > 0) {
      params.set("genres", newGenres.join(","));
    }
    if (newStatus) {
      params.set("status", newStatus);
    }
    if (newSort && newSort !== "updated") {
      params.set("sort", newSort);
    }
    params.set("page", "1");

    router.push(`/comics?${params.toString()}`, { scroll: false });
  };

  const handleStatusClick = (status: string) => {
    updateFilters(currentGenres, status, currentSort);
  };

  const handleCountryClick = (countrySlug: string) => {
    let nextGenres = currentGenres.filter((g) => !countrySlugs.includes(g));
    if (countrySlug) {
      nextGenres.push(countrySlug);
    }
    updateFilters(nextGenres, currentStatus, currentSort);
  };

  const handleSortClick = (sort: string) => {
    updateFilters(currentGenres, currentStatus, sort);
  };

  const handleGenreToggle = (slug: string) => {
    const next = currentGenres.includes(slug)
      ? currentGenres.filter((s) => s !== slug)
      : [...currentGenres, slug];
    updateFilters(next, currentStatus, currentSort);
  };

  const handleReset = () => {
    router.push("/comics");
  };

  const hasActiveFilters =
    currentGenres.length > 0 || !!currentStatus || (currentSort && currentSort !== "updated");

  // Dynamic Page Title
  let pageTitle = "Truyện Mới Cập Nhật";
  if (currentSort === "views") pageTitle = "Truyện Xem Nhiều Nhất";
  else if (currentSort === "rating") pageTitle = "Truyện Đánh Giá Cao";
  else if (currentSort === "new") pageTitle = "Truyện Mới Đăng";
  else if (selectedCountry) pageTitle = `Truyện Tranh ${selectedCountry.label}`;
  else if (currentStatus === "COMPLETED") pageTitle = "Truyện Đã Hoàn Thành";

  // Non-country categories for the genre list
  const generalCategories = categories.filter((c) => !countrySlugs.includes(c.slug));

  return (
    <div className="space-y-4">
      {/* 🚩 Header Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Bookmark className="h-5 w-5 text-orange-500 fill-orange-500" />
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {pageTitle}
          </h1>
        </div>

        <span className="text-xs text-zinc-400">
          Tổng <strong className="text-orange-400 font-bold">{totalCount}</strong> truyện
        </span>
      </div>

      {/* 🎛️ TruyenGG Filter Box */}
      <div className="rounded-2xl border border-zinc-800 bg-[#16161b] p-4 sm:p-5 shadow-xl space-y-3.5">
        {/* Row 1: Tình trạng */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="text-xs font-medium text-zinc-400 sm:w-20 shrink-0">Tình trạng</span>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => handleStatusClick("")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                !currentStatus
                  ? "border border-orange-500/50 bg-orange-500/15 text-orange-400 font-bold"
                  : "border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-white"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => handleStatusClick("ONGOING")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                currentStatus === "ONGOING"
                  ? "border border-orange-500/50 bg-orange-500/15 text-orange-400 font-bold"
                  : "border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-white"
              }`}
            >
              Đang tiến hành
            </button>
            <button
              onClick={() => handleStatusClick("COMPLETED")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                currentStatus === "COMPLETED"
                  ? "border border-orange-500/50 bg-orange-500/15 text-orange-400 font-bold"
                  : "border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-white"
              }`}
            >
              Hoàn thành
            </button>
          </div>
        </div>

        {/* Row 2: Quốc gia */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="text-xs font-medium text-zinc-400 sm:w-20 shrink-0">Quốc gia</span>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => handleCountryClick("")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                !selectedCountry
                  ? "border border-orange-500/50 bg-orange-500/15 text-orange-400 font-bold"
                  : "border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-white"
              }`}
            >
              Tất cả
            </button>
            {countries.map((c) => {
              const isActive = currentGenres.includes(c.slug);
              return (
                <button
                  key={c.slug}
                  onClick={() => handleCountryClick(isActive ? "" : c.slug)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? "border border-orange-500/50 bg-orange-500/15 text-orange-400 font-bold"
                      : "border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Sắp xếp */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="text-xs font-medium text-zinc-400 sm:w-20 shrink-0">Sắp xếp</span>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              { value: "updated", label: "Mới cập nhật" },
              { value: "views", label: "Lượt xem" },
              { value: "rating", label: "Đánh giá cao" },
              { value: "new", label: "Truyện mới" },
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => handleSortClick(s.value)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                  currentSort === s.value
                    ? "border border-orange-500/50 bg-orange-500/15 text-orange-400 font-bold"
                    : "border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 4: Expandable Genres / Reset Action */}
        <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setShowAllGenres(!showAllGenres)}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-orange-400 transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span>
              {showAllGenres ? "Thu gọn danh sách thể loại" : "Lọc thêm theo thể loại"}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                showAllGenres ? "rotate-180 text-orange-400" : ""
              }`}
            />
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 transition cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Đặt lại bộ lọc
            </button>
          )}
        </div>

        {/* Expandable Genre Tags Grid */}
        {showAllGenres && (
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5 animate-in fade-in duration-200">
            {generalCategories.map((cat) => {
              const isSelected = currentGenres.includes(cat.slug);
              return (
                <button
                  key={cat.id}
                  onClick={() => handleGenreToggle(cat.slug)}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition cursor-pointer ${
                    isSelected
                      ? "border border-orange-500/40 bg-orange-500/15 text-orange-400 font-semibold"
                      : "border border-zinc-800/60 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  {isSelected && <span className="text-orange-400 font-bold ml-1">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
