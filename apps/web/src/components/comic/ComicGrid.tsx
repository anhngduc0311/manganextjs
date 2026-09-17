import React from "react";
import { ComicCard } from "./ComicCard";
import type { ComicCardDTO } from "@/types";

export interface ComicGridProps {
  comics: ComicCardDTO[];
  emptyMessage?: string;
  className?: string;
}

export function ComicGrid({
  comics,
  emptyMessage = "Chưa có bộ truyện nào.",
  className,
}: ComicGridProps) {
  if (comics.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-400">
        {emptyMessage}
      </div>
    );
  }

  const defaultGridClass =
    "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4";

  return (
    <div className={className || defaultGridClass}>
      {comics.map((comic, index) => (
        <ComicCard key={comic.id} comic={comic} priority={index < 6} />
      ))}
    </div>
  );
}

