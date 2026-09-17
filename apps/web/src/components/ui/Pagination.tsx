import React from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { PrefetchLink } from "@/components/common/PrefetchLink";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

export function Pagination({ currentPage, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const delta = 2;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1.5 py-6 select-none" aria-label="Phân trang">
      {/* Nút Trước */}
      {currentPage > 1 ? (
        <PrefetchLink
          href={buildHref(currentPage - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition active:scale-95"
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </PrefetchLink>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-600 cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {/* Các số trang */}
      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={`ellipsis-${idx}`} className="flex h-9 w-9 items-center justify-center text-zinc-500">
            ...
          </span>
        ) : (
          <PrefetchLink
            key={`page-${p}`}
            href={buildHref(Number(p))}
            className={`flex h-9 min-w-[36px] px-3 items-center justify-center rounded-lg text-sm font-semibold transition active:scale-95 ${
              p === currentPage
                ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                : "border border-zinc-700/80 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            }`}
          >
            {p}
          </PrefetchLink>
        )
      )}

      {/* Nút Kế tiếp */}
      {currentPage < totalPages ? (
        <PrefetchLink
          href={buildHref(currentPage + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition active:scale-95"
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </PrefetchLink>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-600 cursor-not-allowed">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
