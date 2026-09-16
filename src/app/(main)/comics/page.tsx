import React from "react";
import { Compass, Sparkles } from "lucide-react";
import { comicService } from "@/services/comic.service";
import { FilterSidebar } from "@/components/comic/FilterSidebar";
import { ComicGrid } from "@/components/comic/ComicGrid";
import { Pagination } from "@/components/ui/Pagination";
import type { ComicStatus } from "@/types";

export const metadata = {
  title: "Khám Phá Danh Sách Truyện Tranh — TruyenKomi",
  description: "Khám phá danh sách hàng ngàn bộ truyện tranh đa dạng thể loại: Hành động, Tình cảm, Chuyển sinh, Hài hước được lọc theo sở thích.",
};

interface ComicsPageProps {
  searchParams: Promise<{
    genres?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ComicsPage({ searchParams }: ComicsPageProps) {
  const resolvedParams = await searchParams;
  const genres = resolvedParams.genres ? resolvedParams.genres.split(",").filter(Boolean) : [];
  const status = (resolvedParams.status as ComicStatus) || "";
  const sort = (resolvedParams.sort as "views" | "rating" | "updated" | "new") || "updated";
  const page = Math.max(1, Number(resolvedParams.page || 1));

  const [{ items = [], total = 0, totalPages = 1 }, categories = []] = await Promise.all([
    comicService.listComics({ genres, status, sort, page, perPage: 24 }).catch(() => ({
      items: [],
      total: 0,
      totalPages: 1,
      page: 1,
      perPage: 24,
    })),
    comicService.listCategories().catch(() => []),
  ]);

  const buildPaginationHref = (p: number) => {
    const params = new URLSearchParams();
    if (genres.length > 0) params.set("genres", genres.join(","));
    if (status) params.set("status", status);
    if (sort && sort !== "updated") params.set("sort", sort);
    params.set("page", String(p));
    return `/comics?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header Banner */}
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-orange-500/10 via-zinc-900 to-zinc-900 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 mb-1">
          <Sparkles className="h-4 w-4" /> Thư viện truyện tranh
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">Khám Phá Truyện Tranh</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          Tìm kiếm và lọc các bộ truyện yêu thích theo thể loại, trạng thái ra chương và bảng xếp hạng lượt xem.
        </p>
      </div>

      {/* Main Filter + Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Sidebar Filter */}
        <div className="lg:col-span-1">
          <FilterSidebar categories={categories} />
        </div>

        {/* Right Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header Count */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-semibold text-zinc-300">
                Tìm thấy <strong className="text-orange-400 font-bold">{total}</strong> bộ truyện
              </span>
            </div>
          </div>

          {/* Comics Grid */}
          <ComicGrid comics={items} emptyMessage="Không tìm thấy bộ truyện nào phù hợp với bộ lọc đã chọn." />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-4">
              <Pagination currentPage={page} totalPages={totalPages} buildHref={buildPaginationHref} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
