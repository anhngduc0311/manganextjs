import React from "react";

export default function GlobalLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="relative h-64 sm:h-80 w-full rounded-3xl bg-zinc-900/80 border border-zinc-800/80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800/40 to-zinc-900 animate-shimmer" />
        <div className="p-8 flex flex-col justify-end h-full space-y-3 max-w-lg">
          <div className="h-4 w-28 bg-zinc-800 rounded-full" />
          <div className="h-8 w-64 bg-zinc-800 rounded-xl" />
          <div className="h-4 w-full bg-zinc-800/60 rounded-md" />
        </div>
      </div>

      {/* Grid Skeletons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 bg-zinc-800 rounded-lg" />
          <div className="h-4 w-20 bg-zinc-800/60 rounded-md" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
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
