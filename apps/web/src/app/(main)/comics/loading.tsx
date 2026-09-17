import React from "react";

export default function ComicsCatalogLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-zinc-800 rounded-xl" />
        <div className="h-4 w-72 bg-zinc-800/60 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="h-96 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-5 hidden lg:block" />
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-2 space-y-2">
              <div className="aspect-[3/4] w-full rounded-xl bg-zinc-800/80" />
              <div className="h-3.5 w-3/4 bg-zinc-800 rounded" />
              <div className="h-3 w-1/2 bg-zinc-800/60 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
