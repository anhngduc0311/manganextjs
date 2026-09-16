import React from "react";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { searchService } from "@/services/search.service";
import { ComicGrid } from "@/components/comic/ComicGrid";
import { Pagination } from "@/components/ui/Pagination";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q = "" } = await searchParams;
  return {
    title: q ? `Kết quả tìm kiếm cho "${q}" — TruyenKomi` : "Tìm Kiếm Truyện Tranh — TruyenKomi",
    description: `Tìm kiếm truyện tranh ${q} nhanh chóng, chính xác không phân biệt dấu tại TruyenKomi.`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "", page: pageParam = "1" } = await searchParams;
  const query = q.trim();
  const page = Math.max(1, Number(pageParam || 1));
  const perPage = 24;
  const offset = (page - 1) * perPage;

  let results: any[] = [];
  let total = 0;

  if (query) {
    try {
      [results, total] = await Promise.all([
        searchService.searchComics(query, perPage, offset),
        searchService.totalMatches(query),
      ]);
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const buildPaginationHref = (p: number) => {
    return `/search?q=${encodeURIComponent(query)}&page=${p}`;
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 mb-1">
          <Search className="h-4 w-4" /> Tìm kiếm thông minh
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
          {query ? (
            <>
              Kết quả tìm kiếm cho &quot;<span className="text-orange-500">{query}</span>&quot;
            </>
          ) : (
            "Tìm kiếm truyện tranh"
          )}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          Tìm kiếm siêu tốc hỗ trợ tiếng Việt không dấu và tự động gợi ý sửa lỗi chính tả.
        </p>
      </div>

      {/* Results Header Count */}
      {query && (
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-xs text-zinc-300">
          <span>
            Tìm thấy <strong className="font-bold text-orange-400">{total}</strong> bộ truyện phù hợp
          </span>
        </div>
      )}

      {/* Grid */}
      <ComicGrid
        comics={results}
        emptyMessage={
          query
            ? `Không tìm thấy bộ truyện nào phù hợp với từ khóa "${query}".`
            : "Vui lòng nhập tên truyện hoặc tác giả vào ô tìm kiếm."
        }
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-4">
          <Pagination currentPage={page} totalPages={totalPages} buildHref={buildPaginationHref} />
        </div>
      )}
    </div>
  );
}
