import React from "react";
import { comicService } from "@/services/comic.service";
import { ComicFilterBar } from "@/components/comic/ComicFilterBar";
import { ComicGrid } from "@/components/comic/ComicGrid";
import { Pagination } from "@/components/ui/Pagination";
import type { ComicStatus } from "@/types";

export const revalidate = 60; // ISR cache 60s

export const metadata = {
  title: "Danh Sách Truyện Tranh — TruyenKomi",
  description:
    "Danh sách truyện tranh Manga, Manhwa, Manhua mới nhất, được cập nhật liên tục với bộ lọc thể loại, trạng thái và bảng xếp hạng.",
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
    comicService.listComics({ genres, status, sort, page, perPage: 30 }).catch(() => ({
      items: [],
      total: 0,
      totalPages: 1,
      page: 1,
      perPage: 30,
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
      {/* 🎛️ TruyenGG Filter Header & Filter Box */}
      <ComicFilterBar categories={categories} totalCount={total} />

      {/* 📚 Full-Width Comic Grid (2 to 6 columns) */}
      <ComicGrid
        comics={items}
        emptyMessage="Không tìm thấy bộ truyện nào phù hợp với bộ lọc đã chọn."
      />

      {/* 📄 Pagination */}
      {totalPages > 1 && (
        <div className="pt-4 flex justify-center">
          <Pagination currentPage={page} totalPages={totalPages} buildHref={buildPaginationHref} />
        </div>
      )}
    </div>
  );
}

