import React from "react";

export default function ComicDetailLoading() {
  return (
    <div className="space-y-10 animate-pulse">
      {/* Hero Banner Header Skeleton */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8 md:p-10">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
          <div className="aspect-[3/4] w-48 sm:w-56 shrink-0 rounded-2xl bg-zinc-800 shadow-2xl" />
          <div className="flex-1 space-y-4 w-full text-center md:text-left">
            <div className="h-8 sm:h-10 w-3/4 max-w-md bg-zinc-800 rounded-xl mx-auto md:mx-0" />
            <div className="h-4 w-40 bg-zinc-800/60 rounded mx-auto md:mx-0" />
            <div className="h-6 w-32 bg-zinc-800/80 rounded-lg mx-auto md:mx-0" />
            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              <div className="h-6 w-20 bg-zinc-800/70 rounded-md" />
              <div className="h-6 w-24 bg-zinc-800/70 rounded-md" />
              <div className="h-6 w-16 bg-zinc-800/70 rounded-md" />
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-4">
              <div className="h-10 w-36 bg-orange-500/40 rounded-xl" />
              <div className="h-10 w-32 bg-zinc-800 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Description Skeleton */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3">
        <div className="h-4 w-32 bg-zinc-800 rounded" />
        <div className="space-y-2">
          <div className="h-3.5 w-full bg-zinc-800/60 rounded" />
          <div className="h-3.5 w-5/6 bg-zinc-800/60 rounded" />
          <div className="h-3.5 w-2/3 bg-zinc-800/60 rounded" />
        </div>
      </div>

      {/* Chapters Skeleton */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
          <div className="h-5 w-36 bg-zinc-800 rounded" />
          <div className="h-8 w-48 bg-zinc-800/70 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-zinc-900/80 border border-zinc-800/80" />
          ))}
        </div>
      </div>
    </div>
  );
}
